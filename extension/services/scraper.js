export function scrapeLinkedInMessagesByName() {
    try {
      let conversations = [];
      const chatItems = document.querySelectorAll(".msg-conversations-container__convo-item");
  
      if (!chatItems || chatItems.length === 0) {
        return { error: "No chat items found. Ensure you're on LinkedIn with the messages panel open." };
      }
  
      chatItems.forEach(item => {
        const nameElement = item.querySelector(".msg-conversation-listitem__participant-names");
        const previewElement = item.querySelector(".msg-conversation-card__message-snippet");
  
        if (nameElement) {
          const name = nameElement.innerText.trim();
          const preview = previewElement ? previewElement.innerText.trim() : "No preview available";
          //Sanitize the name to use in Json
          const sanitizedName = name.replace(/,/g, '');
  
          conversations.push({
            name: sanitizedName,
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