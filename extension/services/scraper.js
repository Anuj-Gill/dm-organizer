export async function scrapeLinkedInMessagesByName() {
  try {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const conversationsContainer = document.querySelector(".msg-conversations-container__conversations-list");

    if (!conversationsContainer) {
      return { error: "Ensure you're on LinkedIn with the messages panel open." };
    }

    let previousItemCount = 0;
    let currentItemCount = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 20; // Increased attempts for better reliability
    let hasScrolled = true; // Flag to track if scrolling occurred in the last iteration


    do {
      previousItemCount = document.querySelectorAll(".msg-conversations-container__convo-item").length;

      if (hasScrolled) {
        conversationsContainer.scrollTop = conversationsContainer.scrollHeight;
        await delay(1500); // Increased delay for better loading
      }

      currentItemCount = document.querySelectorAll(".msg-conversations-container__convo-item").length;


      hasScrolled = currentItemCount > previousItemCount;
      scrollAttempts++;
    } while (hasScrolled && scrollAttempts < maxScrollAttempts);


    
    // Now that all conversations are loaded, scrape them
    let conversations = [];
    const chatItems = document.querySelectorAll(".msg-conversations-container__convo-item");
    
    if (!chatItems || chatItems.length === 0) {
      return { error: "No chat items found after scrolling. Ensure you're on LinkedIn with the messages panel open." };
    }
    
    chatItems.forEach(item => {
      const nameElement = item.querySelector(".msg-conversation-listitem__participant-names");
      const previewElement = item.querySelector(".msg-conversation-card__message-snippet");
      
      if (nameElement) {
        const name = nameElement.innerText.trim();
        const preview = previewElement ? previewElement.innerText.trim() : "No preview available";
        //Sanitize the name to use in Json
        const sanitizedName = name.replace(/,/g, '');
        if(preview.slice(0,4) !== "You:") {
          conversations.push({
            name: sanitizedName,
            content: preview,
          });
        }
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

export function detectLinkedInProfileName() {
  const profileNav = document.querySelector('.profile-rail-card__actor-link');
  if (profileNav) {
    return profileNav.textContent.trim();
  }
  // Alternative selectors for finding name
  const altNameElement = document.querySelector('.global-nav__me-photo') || 
                         document.querySelector('.feed-identity-module__actor-meta');
  return altNameElement ? altNameElement.getAttribute('alt') || altNameElement.textContent.trim() : null;
}

export async function openChatByName(targetName) {
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
      // First try using the native click
      matchingItem.click();
      
      // Wait a bit to see if it worked
      await delay(500);
      
      // If clicking didn't work, try more aggressive approach
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      matchingItem.dispatchEvent(clickEvent);
      
      // Successful click
      chrome.runtime.sendMessage({ 
        type: "chatOpened", 
        targetName: targetName 
      });
      return;
    } catch (e) {
      console.error(`[LinkedIn Chat Opener] Error clicking chat: ${e.message}`);
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
}