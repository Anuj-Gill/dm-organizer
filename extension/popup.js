// Execute code when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Get references to user info elements
  const linkedinUsernameInput = document.getElementById('linkedinUsername');
  const userNameInput = document.getElementById('userName');
  const saveUserInfoButton = document.getElementById('saveUserInfo');
  const userGreeting = document.getElementById('userGreeting');
  const fetchButton = document.getElementById('fetchMessages');
  
  // Load saved user info from localStorage if available
  const savedLinkedinUsername = localStorage.getItem('linkedinUsername');
  const savedUserName = localStorage.getItem('userName');
  
  if (savedLinkedinUsername) {
    linkedinUsernameInput.value = savedLinkedinUsername;
  }
  
  if (savedUserName) {
    userNameInput.value = savedUserName;
  }
  
  // If both values exist, show greeting and enable fetch button
  if (savedLinkedinUsername && savedUserName) {
    userGreeting.textContent = `Hello, ${savedUserName}!`;
    userGreeting.style.display = 'block';
    fetchButton.disabled = false;
  }
  
  // Save user info to localStorage when the save button is clicked
  saveUserInfoButton.addEventListener('click', () => {
    const linkedinUsername = linkedinUsernameInput.value.trim();
    const userName = userNameInput.value.trim();
    
    if (!linkedinUsername || !userName) {
      alert('Please enter both LinkedIn username and your name.');
      return;
    }
    
    // Save to localStorage
    localStorage.setItem('linkedinUsername', linkedinUsername);
    localStorage.setItem('userName', userName);
    
    // Show greeting and enable fetch button
    userGreeting.textContent = `Hello, ${userName}!`;
    userGreeting.style.display = 'block';
    fetchButton.disabled = false;
  });

  // Auto-detect LinkedIn username if on LinkedIn
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // Check if user is on LinkedIn
    if (tabs[0].url.includes('linkedin.com')) {
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
            if (detectedName && !userNameInput.value) {
              userNameInput.value = detectedName;
            }
          }
        }
      );
    }
  });

  // Select the "Fetch Messages" button and add a click event listener
  fetchButton.addEventListener("click", () => {
    // Get references to important DOM elements for later use
    const loader = document.getElementById("loader");        // Loading spinner
    const error = document.getElementById("error");          // Error message container
    const messageList = document.getElementById("messageList"); // Results list container
    
    // Clear out any previous results and error messages
    messageList.innerHTML = "";
    error.style.display = "none";
    error.textContent = "";
    
    // Show the loading spinner and disable the button to prevent multiple clicks
    loader.style.display = "block";
    fetchButton.disabled = true;
    
    // Get the currently active browser tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      // Execute a script in the context of the current webpage (LinkedIn)
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id }, // Run in the current tab
          func: () => {
            // This entire function runs in the context of the LinkedIn page, not your extension
            try {
              // Array to store all conversations we find
              let conversations = [];
              
              // Find all conversation items in the LinkedIn messages sidebar
              // These are the individual chat conversations in the left panel
              const chatItems = document.querySelectorAll(".msg-conversations-container__convo-item");
              
              // If no conversations are found, return an error
              if (!chatItems || chatItems.length === 0) {
                return { error: "No chat items found. Make sure you're on LinkedIn with the messages panel open." };
              }
              
              // Loop through each conversation item in the sidebar
              chatItems.forEach((item) => {
                // Find the name element (shows who the conversation is with)
                const nameElement = item.querySelector(".msg-conversation-listitem__participant-names");
                
                // Find the message preview element (shows the latest message snippet)
                const previewElement = item.querySelector(".msg-conversation-card__message-snippet");
                
                // Try to get the thread ID from the data attributes or link
                let threadId = null;
                
                // Method 1: Try to get from the data attribute if available
                if (item.dataset && item.dataset.threadUrn) {
                  threadId = item.dataset.threadUrn;
                }
                
                // Method 2: Try to get from the anchor tag
                if (!threadId) {
                  const linkElement = item.querySelector("a");
                  if (linkElement) {
                    // Store the actual href for later use
                    const href = linkElement.getAttribute('href');
                    
                    // Handle both formats:
                    // 1. /messaging/thread/2-MDk3MDliYjktNzdlMS00OTI1LWFmZTktYzYwMzQ1YTc3YjA3XzEwMA==/
                    // 2. https://www.linkedin.com/messaging/thread/2-MDk3MDliYjktNzdlMS00OTI1LWFmZTktYzYwMzQ1YTc3YjA3XzEwMA==/
                    if (href) {
                      const threadMatch = href.match(/thread\/([^\/]+)/);
                      if (threadMatch && threadMatch[1]) {
                        threadId = threadMatch[1];
                      }
                    }
                    
                    // If that didn't work, try clicking the conversation to load it and get the URL
                    if (!threadId) {
                      // Store the current URL to return to it
                      const currentUrl = window.location.href;
                      
                      // Click the conversation to load it
                      linkElement.click();
                      
                      // Wait a moment for the conversation to load
                      setTimeout(() => {
                        // Get the URL from the address bar
                        const newUrl = window.location.href;
                        const urlThreadMatch = newUrl.match(/thread\/([^\/]+)/);
                        if (urlThreadMatch && urlThreadMatch[1]) {
                          threadId = urlThreadMatch[1];
                        }
                        
                        // Go back to the previous URL
                        if (currentUrl !== newUrl) {
                          window.history.back();
                        }
                      }, 100);
                    }
                  }
                }
                
                // Method 3: Check if this is already a conversation page and get from URL
                if (!threadId) {
                  const currentUrl = window.location.href;
                  if (currentUrl.includes('/messaging/thread/')) {
                    const urlThreadMatch = currentUrl.match(/thread\/([^\/]+)/);
                    if (urlThreadMatch && urlThreadMatch[1]) {
                      threadId = urlThreadMatch[1];
                    }
                  }
                }
                
                // Another approach: try to extract from element ID or other attributes
                if (!threadId) {
                  if (item.id && item.id.includes('thread')) {
                    const idMatch = item.id.match(/thread[-_]?([^-_]+)/);
                    if (idMatch && idMatch[1]) {
                      threadId = idMatch[1];
                    }
                  }
                }
                
                // Only proceed if we found a name (ensures it's a valid conversation)
                if (nameElement) {
                  // Extract the text content and remove extra whitespace
                  const name = nameElement.innerText.trim();
                  
                  // Get the message preview text, or use a placeholder if none found
                  const preview = previewElement ? previewElement.innerText.trim() : "No preview available";
                  
                  // Add this conversation to our results array
                  // We're putting the preview in an array because our UI expects an array of messages
                  conversations.push({
                    name: name,
                    threadId: threadId || "Unknown",
                    messages: [preview]
                  });
                }
              });
              
              // Return the array of conversations back to the extension
              return conversations;
            } catch (err) {
              // If anything goes wrong, return the error
              return { error: err.message || "Unknown error occurred" };
            }
          }
        },
        (results) => {
          // This callback runs after the script execution completes
          
          // Hide the loading spinner and re-enable the button
          loader.style.display = "none";
          fetchButton.disabled = false;
          
          // Check for Chrome extension runtime errors
          if (chrome.runtime.lastError) {
            error.textContent = "Error: " + chrome.runtime.lastError.message;
            error.style.display = "block";
            return;
          }
          
          // Check if we got valid results back
          if (!results || !results[0] || !results[0].result) {
            error.textContent = "Failed to fetch messages. Make sure you're on LinkedIn with messages open.";
            error.style.display = "block";
            return;
          }
          
          // Extract the data from results
          const result = results[0].result;
          
          // Check if the result contains an error message
          if (result.error) {
            error.textContent = "Error: " + result.error;
            error.style.display = "block";
            return;
          }
          
          // Check if we found any conversations
          if (result.length === 0) {
            error.textContent = "No conversations found.";
            error.style.display = "block";
            return;
          }
          
          // For each conversation, create a list item and add it to the UI
          result.forEach((conv) => {
            let li = document.createElement("li");
            // Format with the name in bold, thread ID, and messages displayed on separate lines
            li.innerHTML = `<strong>${conv.name}</strong> (Thread ID: ${conv.threadId})<br>${conv.messages.join("<br>")}`;
            messageList.appendChild(li);
          });
        }
      );
    });
  });
});