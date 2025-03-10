// Execute code when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // ... (Rest of your initialization code, as before) ...
  // Get references to UI elements
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
    filteredMessages: document.getElementById("filteredMessages")
  };
  
  // API configuration
  const API_ENDPOINT = "http://localhost:3000/api/message/process";
  
  // Store messages and tags globally for filtering
  let processedMessages = [];
  let activeFilter = null;
  
  // Initialize user interface
  initializeUI(elements);
  
  // Set up event listeners
  setupEventListeners(elements);
  
  // Auto-detect LinkedIn username if on LinkedIn
  detectLinkedInProfile(elements);

// UI initialization
function initializeUI(elements) {
    // ... (Your existing initializeUI code) ...
    // Load saved user info from localStorage if available
    const savedLinkedinUsername = localStorage.getItem('linkedinUsername');
    const savedUserName = localStorage.getItem('userName');
    
    if (savedLinkedinUsername) {
      elements.linkedinUsernameInput.value = savedLinkedinUsername;
    }
    
    if (savedUserName) {
      elements.userNameInput.value = savedUserName;
    }
    
    // If both values exist, show greeting and enable fetch button
    if (savedLinkedinUsername && savedUserName) {
      elements.userGreeting.textContent = `Hello, ${savedUserName}!`;
      elements.userGreeting.style.display = 'block';
      elements.fetchButton.disabled = false;
    }
}

// Setup event listeners
function setupEventListeners(elements) {
    // ... (Your existing setupEventListeners code) ...
     // Save user info to localStorage when the save button is clicked
    elements.saveUserInfoButton.addEventListener('click', () => {
      saveUserInfo(elements);
    });
    
    // Fetch messages when button is clicked
    elements.fetchButton.addEventListener("click", () => {
      fetchLinkedInMessages(elements);
    });
}

// Save user info function
function saveUserInfo(elements) {
    // ... (Your existing saveUserInfo code) ...
    const linkedinUsername = elements.linkedinUsernameInput.value.trim();
    const userName = elements.userNameInput.value.trim();
    
    if (!linkedinUsername || !userName) {
      showError('Please enter both LinkedIn username and your name.', elements);
      return;
    }
    
    // Save to localStorage
    localStorage.setItem('linkedinUsername', linkedinUsername);
    localStorage.setItem('userName', userName);
    
    // Show greeting and enable fetch button
    elements.userGreeting.textContent = `Hello, ${userName}!`;
    elements.userGreeting.style.display = 'block';
    elements.fetchButton.disabled = false;
    showSuccess('User information saved!', elements);
}

// Auto-detect LinkedIn username function
function detectLinkedInProfile(elements) {
    // ... (Your existing detectLinkedInProfile code) ...
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              // Check if user is on LinkedIn
              if (tabs[0] && tabs[0].url && tabs[0].url.includes('linkedin.com')) {
                chrome.scripting.executeScript(
                  {
                    target: { tabId: tabs[0].id },
                    func: () => {
                      // Try to find user's name on LinkedIn page
                      const profileNav = document.querySelector('.profile-rail-card__actor-link');
                      if (profileNav) {
                        return profileNav.textContent.trim();
                      }
                      // Alternative selectors for finding name
                      const altNameElement = document.querySelector('.global-nav__me-photo') || 
                                             document.querySelector('.feed-identity-module__actor-meta');
                      return altNameElement ? altNameElement.getAttribute('alt') || altNameElement.textContent.trim() : null;
                    }
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


  function fetchLinkedInMessages(elements) {
      // ... (Your existing setup, as before) ...
      console.log("Starting message fetch process...");
        
    // Clear out any previous results and error messages
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
              func: scrapeLinkedInMessagesByName, // Use the new function
          },
          (results) => processScrapingResults(results, elements)
      );
    });
  }

  // NEW SCRAPING FUNCTION (using name)
  function scrapeLinkedInMessagesByName() {
      try {
          let conversations = [];
          const chatItems = document.querySelectorAll(".msg-conversations-container__convo-item");

          if (!chatItems || chatItems.length === 0) {
              return { error: "No chat items found.  Ensure you're on LinkedIn with the messages panel open." };
          }

          chatItems.forEach(item => {
              const nameElement = item.querySelector(".msg-conversation-listitem__participant-names");
              const previewElement = item.querySelector(".msg-conversation-card__message-snippet");

              if (nameElement) {
                  const name = nameElement.innerText.trim();
                  const preview = previewElement ? previewElement.innerText.trim() : "No preview available";
                  //Sanitize the name to use in Json
                  const sanitizedName = name.replace(/,/g, ''); // Remove commas


                  conversations.push({
                      name: sanitizedName, // Use the name as the identifier
                      content: preview,
                  });
              }
          });

          return conversations.map(conv => ({
              messageId: conv.name, // Use name as messageId
              content: conv.content,
          }));

      } catch (err) {
          console.error("Scraping error:", err);
          return { error: err.message || "Unknown error occurred" };
      }
  }



  function processScrapingResults(results, elements) {
      // ... (Your existing error handling, as before) ...
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
      sendToAPI(result, result, elements); // Pass result directly
  }

  function sendToAPI(formattedMessages, originalMessages, elements) {
      // ... (Your existing sendToAPI code, using formattedMessages) ...
      console.log("Sending data to API:", JSON.stringify({ messages: formattedMessages }));
          
      fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages: formattedMessages }),
        // Set timeout to prevent hanging
        signal: AbortSignal.timeout(10000)
      })
      .then(response => {
        console.log("API response status:", response.status);
        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Process the API response
        console.log("API Response data:", data);
        processApiResponse(data, originalMessages, elements);
      })
      .catch(err => {
        console.error("API Error:", err);
        elements.loader.style.display = "none";
        elements.fetchButton.disabled = false;
        showError("Unable to reach API. Please try again later.", elements);
      });

  }


  function processApiResponse(data, originalMessages, elements) {
      // Use originalMessages directly; it has the correct name-based identifier
      processedMessages = originalMessages.map(conv => {
        // Find tags for this message using messageId (which is now the name)
        const tagInfo = data.tags.find(t => t.messageId === conv.messageId);
        const tags = tagInfo ? tagInfo.tags : [];

        return {
            name: conv.messageId, // Use messageId (name) from originalMessages
            preview: conv.content,
            tags: tags
        };
    });

    // ... (Rest of your processApiResponse code, as before) ...
    // Count tags for filter options
    const tagCounts = countTags(processedMessages);
    
    // Display filter options
    displayFilterOptions(tagCounts, elements);
    
    // Show all messages initially
    activeFilter = null;
    displayFilteredMessages(elements);
    
    // Show message container and hide loader
    elements.messageContainer.style.display = "block";
    elements.loader.style.display = "none";
    elements.fetchButton.disabled = false;
    
    showSuccess("Messages processed successfully!", elements);
}
// Function to count occurrences of each tag
function countTags(messages) {
// ... (Your existing countTags code) ...
const counts = {};
    
    messages.forEach(msg => {
      msg.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    
    return counts;
}

// Function to display filter options
function displayFilterOptions(tagCounts, elements) {
// ... (Your existing displayFilterOptions code) ...
elements.filterContainer.innerHTML = "";
    
    const filters = [
      { id: 'high-priority', name: 'High Priority', icon: '🔴', count: tagCounts['High Priority'] || 0 },
      { id: 'spam', name: 'Spam', icon: '🚫', count: tagCounts['Spam'] || 0 },
      { id: 'networking', name: 'Networking', icon: '🔗', count: tagCounts['Networking'] || 0 },
      { id: 'sales', name: 'Sales & Outreach', icon: '💼', count: tagCounts['Sales & Outreach'] || 0 },
      { id: 'needs-response', name: 'Needs Response', icon: '✉️', count: tagCounts['Needs Response'] || 0 },
      { id: 'all', name: 'All Messages', icon: '📋', count: processedMessages.length }
    ];
    
    filters.forEach(filter => {
      const button = document.createElement('button');
      button.className = 'filter-btn';
      button.dataset.filter = filter.name;
      button.innerHTML = `
        <span class="filter-icon">${filter.icon}</span>
        <span class="filter-name">${filter.name}</span>
        <span class="filter-count">${filter.count}</span>
      `;
      
      // Add active class if this is the active filter
      if (activeFilter === filter.name) {
        button.classList.add('active');
      }
      
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        
        // Add active class to this button
        button.classList.add('active');
        
        // Set active filter
        activeFilter = filter.name === 'All Messages' ? null : filter.name;
        
        // Filter and display messages
        displayFilteredMessages(elements);
      });
      
      elements.filterContainer.appendChild(button);
    });
}

// Function to display filtered messages
function displayFilteredMessages(elements) {
  elements.filteredMessages.innerHTML = ""; // Clear previous results

  let filteredList = processedMessages;

  // Filter messages if a filter is active
  if (activeFilter) {
      filteredList = processedMessages.filter(msg => {
          return msg.tags.includes(activeFilter);
      });
  }

  // Show no results message if no messages match the filter
  if (filteredList.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.textContent = activeFilter ?
          `No messages found with tag: ${activeFilter}` :
          'No messages found';
      elements.filteredMessages.appendChild(noResults);
      return;
  }

  // Create and append message items
  filteredList.forEach(msg => {
      const messageItem = document.createElement('div');
      messageItem.className = 'message-item';

      // Create tag pills
      const tagPills = msg.tags.map(tag =>
          `<span class="tag-pill ${tag.toLowerCase().replace(/\s+/g, '-')}">${tag}</span>`
      ).join('');

      messageItem.innerHTML = `
          <div class="message-header">
              <span class="message-name">${msg.name}</span>
              <div class="message-tags">${tagPills}</div>
          </div>
          <div class="message-preview">${msg.preview}</div>
      `;

      // --- CORRECTED CLICK HANDLER ---
      // 1. Remove any existing event listeners (VERY IMPORTANT)
      messageItem.removeEventListener('click', messageItemClickHandler); // Remove old listener

      // 2. Define the click handler (named function for easier removal)
      function messageItemClickHandler() {
          chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
              const currentTab = tabs[0];
              if (currentTab.url.includes('linkedin.com')) {
                  chrome.scripting.executeScript({
                      target: { tabId: currentTab.id },
                      func: openChatByName,
                      args: [msg.name] // Pass the name
                  });
              } else {
                  chrome.tabs.create({ url: 'https://www.linkedin.com/messaging/' });
              }
          });
      }

      // 3. Attach the NEW event listener
      messageItem.addEventListener('click', messageItemClickHandler);

      elements.filteredMessages.appendChild(messageItem);
  });
}

// --- NEW FUNCTION: Open chat by name (injected into LinkedIn page) ---
async function openChatByName(targetName) {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Wait up to 5 seconds for chat items to load.
  for (let i = 0; i < 50; i++) {
      if (document.querySelectorAll(".msg-conversations-container__convo-item").length > 0) {
          break;
      }
      await delay(100);
  }

  const chatItems = document.querySelectorAll(".msg-conversations-container__convo-item");
  let chatFound = false;

  for (const item of chatItems) {
      const nameElement = item.querySelector(".msg-conversation-listitem__participant-names");
      // More robust name matching (case-insensitive and includes)
      if (nameElement && nameElement.innerText.trim().toLowerCase().includes(targetName.toLowerCase())) {
          item.click();
          chatFound = true;
          break;
      }
  }

  if (!chatFound) {
      console.warn(`Chat with ${targetName} not found.`);
      // Send message back to extension for UI update
      chrome.runtime.sendMessage({ type: "chatNotFound", targetName: targetName });
  }
}


// Function to show error messages
function showError(message, elements) {
    // ... (Your existing showError code) ...
    elements.error.textContent = message;
    elements.error.style.display = "block";
    setTimeout(() => {
      elements.error.style.display = "none";
    }, 5000);
}

// Function to show success messages
function showSuccess(message, elements) {
    // ... (Your existing showSuccess code) ...
    const successEl = document.getElementById("success");
    successEl.textContent = message;
    successEl.style.display = "block";
    setTimeout(() => {
      successEl.style.display = "none";
    }, 3000);
}
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "chatNotFound") {
    showError(`Chat with ${message.targetName} not found.`, elements); // Show error in your extension UI
  }
});