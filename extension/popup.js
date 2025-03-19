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
    groqApiKey: document.getElementById("groqApiKey"),
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
    const apiKey = elements.groqApiKey.value.trim();
    
    if (!linkedinUsername || !userName || !apiKey) {
      showError('Please enter LinkedIn username your name and your Groq API Key.', elements);
      return;
    }
    
    saveUserInfo(linkedinUsername, userName, apiKey);
    
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
          func: (targetName) => {
            // Define the function in the page context
            window.openChatByName = async function(targetName) {
              const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
              
              // Check if we're already on the messaging page with threads visible
              const isOnMessagingPage = document.querySelector(".msg-conversations-container__convo-item");
              
              if (!isOnMessagingPage) {
                
                // Check if we're on LinkedIn but need to open messaging
                if (window.location.href.includes('linkedin.com')) {
                  
                  // Try to click on the messaging icon if it exists
                  const messagingIcon = document.querySelector('[data-control-name="messaging"]') || 
                                       document.querySelector('.msg-overlay-bubble-header') ||
                                       document.querySelector('.global-nav__icon-link[href*="messaging"]');
                  
                  if (messagingIcon) {
                    messagingIcon.click();
                    await delay(1000); // Wait for messaging to open
                  } else {
                    // If we can't find the messaging icon, navigate directly
                    chrome.runtime.sendMessage({ 
                      type: "navigateToMessaging", 
                      targetName: targetName 
                    });
                    return;
                  }
                } else {
                  chrome.runtime.sendMessage({ 
                    type: "navigateToMessaging", 
                    targetName: targetName 
                  });
                  return;
                }
              }
              
              await delay(500); // Give time for things to settle
              
              // Get all conversation items
              let chatItems = document.querySelectorAll(".msg-conversations-container__convo-item");
              
              // If no chat items found, wait a bit longer
              if (chatItems.length === 0) {
                for (let i = 0; i < 10; i++) {
                  await delay(300);
                  chatItems = document.querySelectorAll(".msg-conversations-container__convo-item");
                  if (chatItems.length > 0) break;
                }
              }
              
              if (chatItems.length === 0) {
                chrome.runtime.sendMessage({ 
                  type: "chatNotFound", 
                  targetName: targetName,
                  reason: "No chat items found after waiting" 
                });
                return;
              }
            
              // Log all available chat participants for debugging
              Array.from(chatItems).forEach(item => {
                const nameEl = item.querySelector(".msg-conversation-listitem__participant-names");
              });
            
              // First try direct matching
              let matchingItem = null;
              let exactMatch = false;
            
              for (const item of chatItems) {
                const nameElement = item.querySelector(".msg-conversation-listitem__participant-names");
                if (!nameElement) continue;
                
                const chatName = nameElement.innerText.trim();
                
                // Check for exact match first
                if (chatName.toLowerCase() === targetName.toLowerCase()) {
                  matchingItem = item;
                  exactMatch = true;
                  break;
                }
                
                // If no exact match yet, check for partial match
                if (!exactMatch && chatName.toLowerCase().includes(targetName.toLowerCase())) {
                  matchingItem = item;
                }
              }
            
              if (matchingItem) {
            
                try {
                    matchingItem.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                    await delay(500);
            
                    const triggerElement = matchingItem.querySelector(".msg-conversation-listitem__participant-names"); // Adjust selector
            
                    if (triggerElement) {
            
                        const rect = triggerElement.getBoundingClientRect();
                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;
            
                        const mouseDownEvent = new MouseEvent('mousedown', {
                            view: window,
                            bubbles: true,
                            cancelable: true,
                            clientX: centerX,
                            clientY: centerY,
                        });
                        triggerElement.dispatchEvent(mouseDownEvent);
            
                        await delay(100);
            
                        const mouseUpEvent = new MouseEvent('mouseup', {
                            view: window,
                            bubbles: true,
                            cancelable: true,
                            clientX: centerX,
                            clientY: centerY,
                        });
                        triggerElement.dispatchEvent(mouseUpEvent);
            
                        await delay(100);
            
                        const clickEvent = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true,
                            clientX: centerX,
                            clientY: centerY,
                        });
                        triggerElement.dispatchEvent(clickEvent);
            
                        await delay(500);
                        chrome.runtime.sendMessage({
                            type: "chatOpened",
                            targetName: targetName
                        });
                        return;
                    } else {
                        console.error("[LinkedIn Chat Opener] Trigger element not found.");
                    }
                } catch (e) {
                    console.error(`[LinkedIn Chat Opener] Error clicking chat: ${e.message}`, e);
                }
            }
            
              // If we get here, we didn't find the chat or couldn't click it
              // Try the search approach
              
              // Different selectors for the search box
              const searchSelectors = [
                ".msg-overlay-bubble-header__search-input",
                ".msg-search-form__search-input",
                ".msg-search-form__typeahead input",
                "input[placeholder*='Search messages']",
                "input[aria-label*='Search messages']"
              ];
              
              let searchBox = null;
              for (const selector of searchSelectors) {
                searchBox = document.querySelector(selector);
                if (searchBox) {
                  break;
                }
              }
              
              if (searchBox) {
                try {
                  // Focus and click the search box
                  searchBox.focus();
                  searchBox.click();
                  await delay(300);
                  
                  // Clear existing text and set new value
                  searchBox.value = "";
                  searchBox.value = targetName;
                  
                  // Trigger events to ensure LinkedIn registers the input
                  searchBox.dispatchEvent(new Event('input', { bubbles: true }));
                  searchBox.dispatchEvent(new Event('change', { bubbles: true }));
                  
                  await delay(800); // Wait for search results
                  
                  // Try to find search results
                  const searchResultSelectors = [
                    ".msg-search-typeahead__result-item",
                    ".msg-search-typeahead__option",
                    ".msg-search-pill__text"
                  ];
                  
                  let searchResults = [];
                  for (const selector of searchResultSelectors) {
                    searchResults = document.querySelectorAll(selector);
                    if (searchResults.length > 0) {
                      break;
                    }
                  }
                  
                  if (searchResults.length > 0) {
                    // Click the first result
                    searchResults[0].click();
                    
                    // Success!
                    chrome.runtime.sendMessage({ 
                      type: "chatOpened", 
                      targetName: targetName 
                    });
                    return;
                  } else {
                  }
                } catch (e) {
                  console.error(`[LinkedIn Chat Opener] Error using search: ${e.message}`);
                }
              } else {
              }
            
              // If we get here, all attempts failed
              chrome.runtime.sendMessage({ 
                type: "chatNotFound", 
                targetName: targetName,
                reason: "Could not find or open chat after multiple attempts" 
              });
            };
            
            // Execute the function
            window.openChatByName(targetName);
          },
          args: [message.name]
        }, (results) => {
          if (chrome.runtime.lastError) {
            console.error(`Script execution error: ${chrome.runtime.lastError.message}`);
          } else {
            console.log(`Script executed successfully: ${JSON.stringify(results)}`);
          }
        });
      } else {
        console.log('Not on LinkedIn, opening LinkedIn messaging page');
        // Store the target name in session storage to use after navigation
        sessionStorage.setItem('pendingChatTarget', message.name);
        chrome.tabs.create({ url: 'https://www.linkedin.com/messaging/' }, (tab) => {
          // Set a timeout to allow the page to load
          setTimeout(() => {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: (targetName) => {
                console.log(`[LinkedIn Chat Opener] Page loaded, attempting to find chat with ${targetName}`);
                if (window.openChatByName) {
                  window.openChatByName(targetName);
                }
              },
              args: [message.name]
            });
          }, 5000);
        });
      }
    });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  const elements = {
    error: document.getElementById("error"),
    success: document.getElementById("success")
  };
  
  switch (message.type) {
    case "chatNotFound":
      showError(`Chat with ${message.targetName} not found. ${message.reason || ''}`, elements);
      break;
      
    case "chatOpened":
      showSuccess(`Successfully opened chat with ${message.targetName}`, elements);
      break;
      
    case "navigateToMessaging":
      console.log("Navigating to LinkedIn messaging page");
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs[0]) {
          // Store the target name in session storage to use after navigation
          sessionStorage.setItem('pendingChatTarget', message.targetName);
          
          // Navigate to messaging page
          chrome.tabs.update(tabs[0].id, { url: 'https://www.linkedin.com/messaging/' }, () => {
            console.log("Navigation initiated");
            
            // Set a timeout to retry finding the chat after navigation
            setTimeout(() => {
              chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: (targetName) => {
                  console.log(`[LinkedIn Chat Opener] Attempting to find chat with ${targetName} after navigation`);
                  
                  // Get the openChatByName function from the page
                  if (window.openChatByName) {
                    window.openChatByName(targetName);
                  } else {
                    console.log("[LinkedIn Chat Opener] openChatByName function not found on page");
                  }
                },
                args: [message.targetName]
              });
            }, 3000);
          });
        }
      });
      break;
      
    default:
      console.log(`Unknown message type: ${message.type}`);
  }
});