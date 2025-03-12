import { scrapeLinkedInMessagesByName, detectLinkedInProfileName, openChatByName } from './services/scraper.js';
import { initializeUI, displayFilterOptions, displayFilteredMessages, showError, showSuccess } from './services/ui.js';
import { saveUserInfo, loadUserInfo, saveUserMessages } from './services/storage.js';
import { sendToAPI, processApiResponseData } from './services/api.js';
import { countTags } from './services/utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    linkedinUsernameInput: document.getElementById('linkedinUsername'),
    userNameInput: document.getElementById('userName'),
    saveUserInfoButton: document.getElementById('saveUserInfo'),
    userGreeting: document.getElementById('userGreeting'),
    fetchButton: document.getElementById('fetchMessages'),
    loader: document.getElementById("loader"),
    error: document.getElementById("error"),
    messageContainer: document.getElementById("messageContainer"),
    filterContainer: document.getElementById("filterOptions"),
    filteredMessages: document.getElementById("filteredMessages"),
    priorityInupt: document.getElementById("priorityInput"),
  };
  
  let processedMessages = [];
  let activeFilter = null;
  
  initializeUI(elements);
  
  setupEventListeners();
  
  detectLinkedInProfile();

  function setupEventListeners() {
    // Save user info to localStorage when the save button is clicked
    elements.saveUserInfoButton.addEventListener('click', () => {
      handleSaveUserInfo();
    });
    
    // Fetch messages when button is clicked
    elements.fetchButton.addEventListener("click", () => {
      fetchLinkedInMessages();
    });
  }

  function handleSaveUserInfo() {
    const linkedinUsername = elements.linkedinUsernameInput.value.trim();
    const userName = elements.userNameInput.value.trim();
    
    if (!linkedinUsername || !userName) {
      showError('Please enter both LinkedIn username and your name.', elements);
      return;
    }
    
    saveUserInfo(linkedinUsername, userName);
    
    elements.userGreeting.textContent = `Hello, ${userName}!`;
    elements.userGreeting.style.display = 'block';
    elements.fetchButton.disabled = false;
    showSuccess('User information saved!', elements);
  }

  function detectLinkedInProfile() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      // Check if user is on LinkedIn
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('linkedin.com')) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: detectLinkedInProfileName
          },
          (results) => {
            if (results && results[0] && results[0].result) {
              const detectedName = results[0].result;
              if (detectedName && !elements.userNameInput.value) {
                elements.userNameInput.value = detectedName;
              }
            }
          }
        );
      }
    });
  }

  function fetchLinkedInMessages() {
    console.log("Starting message fetch process...");
      
    elements.filteredMessages.innerHTML = "";
    elements.error.style.display = "none";
    elements.error.textContent = "";
    
    // Show the loading spinner and disable the button to prevent multiple clicks
    elements.loader.style.display = "block";
    elements.fetchButton.disabled = true;
    elements.messageContainer.style.display = "none";
    
    // Get the currently active browser tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) {
        elements.loader.style.display = "none";
        elements.fetchButton.disabled = false;
        showError("No active tab found. Please refresh and try again.", elements);
        return;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: scrapeLinkedInMessagesByName,
        },
        (results) => processScrapingResults(results)
      );
    });
  }

  function processScrapingResults(results) {
    // Check for Chrome extension runtime errors
    if (chrome.runtime.lastError) {
      elements.loader.style.display = "none";
      elements.fetchButton.disabled = false;
      showError("Error: " + chrome.runtime.lastError.message, elements);
      return;
    }
    
    // Check if we got valid results back
    if (!results || !results[0] || !results[0].result) {
      elements.loader.style.display = "none";
      elements.fetchButton.disabled = false;
      showError("Failed to fetch messages. Make sure you're on LinkedIn with messages open.", elements);
      return;
    }
    
    // Extract the data from results
    const result = results[0].result;
    
    // Check if the result contains an error message
    if (result.error) {
      elements.loader.style.display = "none";
      elements.fetchButton.disabled = false;
      showError("Error: " + result.error, elements);
      return;
    }
    
    // Check if we found any conversations
    if (result.length === 0) {
      elements.loader.style.display = "none";
      elements.fetchButton.disabled = false;
      showError("No conversations found.", elements);
      return;
    }

    console.log("Messages to be sent to API:", result);
    sendToAPI(
      result, 
      result, 
      elements, 
      handleApiSuccess,
      handleApiError
    );
  }

  function handleApiSuccess(data, originalMessages) {
    // Process the API response data
    processedMessages = processApiResponseData(data, originalMessages);
    saveUserMessages(processedMessages);
    // Count tags for filter options
    const tagCounts = countTags(processedMessages);
    
    // Display filter options
    displayFilterOptions(
      tagCounts, 
      elements, 
      activeFilter, 
      (newFilter) => {
        activeFilter = newFilter;
        displayFilteredMessages(processedMessages, activeFilter, elements, handleMessageClick);
      }
    );
    
    // Show all messages initially
    displayFilteredMessages(processedMessages, activeFilter, elements, handleMessageClick);
    
    // Show message container and hide loader
    elements.messageContainer.style.display = "block";
    elements.loader.style.display = "none";
    elements.fetchButton.disabled = false;
    
    showSuccess("Messages processed successfully!", elements);
  }

  function handleApiError(errorMessage) {
    elements.loader.style.display = "none";
    elements.fetchButton.disabled = false;
    showError(errorMessage, elements);
  }

  function handleMessageClick(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const currentTab = tabs[0];
      if (currentTab.url.includes('linkedin.com')) {
        chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          func: openChatByName,
          args: [message.name]
        });
      } else {
        chrome.tabs.create({ url: 'https://www.linkedin.com/messaging/' });
      }
    });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "chatNotFound") {
    const elements = {
      error: document.getElementById("error")
    };
    showError(`Chat with ${message.targetName} not found.`, elements);
  }
});