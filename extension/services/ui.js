export function initializeUI(elements) {
  const savedLinkedinUsername = localStorage.getItem('linkedinUsername');
  const savedUserName = localStorage.getItem('userName');
  const savedApiKey = localStorage.getItem('apiKey');
  const savedModel = localStorage.getItem('model');
  const savedApiProvider = localStorage.getItem('apiProvider');

  if (savedLinkedinUsername) {
    elements.linkedinUsernameInput.value = savedLinkedinUsername;
  }

  if (savedUserName) {
    elements.userNameInput.value = savedUserName;
  }

  if (savedApiKey) {
    elements.apiKeyInput.value = savedApiKey;
  }

  if (savedApiProvider) {
    elements.apiProviderSelect.value = savedApiProvider;
     // Ensure model dropdown is updated
    if (savedModel) {
      elements.modelSelect.value = savedModel;
    }
  } 

  if (savedLinkedinUsername && savedUserName && savedApiKey) {
    elements.userGreeting.textContent = `Hello, ${savedUserName}!`;
    elements.userGreeting.style.display = 'block';
    elements.fetchButton.disabled = false;
    elements.userInfoSection.style.display = 'none'; // Hide userInfo section
    elements.editUserInfo.style.display = 'block'; // Show edit button
  } else {
    elements.userInfoSection.style.display = 'block';
    elements.editUserInfo.style.display = 'none';
  }
}

export function setupEditButton(elements) {
  elements.editUserInfo.addEventListener('click', () => {
    elements.userInfoSection.style.display = 'block';
    elements.editUserInfo.style.display = 'none';
  });
}
  
  export function displayFilterOptions(tagCounts, elements, activeFilter, onFilterClick) {
    console.log(tagCounts);
    elements.filterContainer.innerHTML = "";
    const filters = [
      { 
        id: 'priority', 
        name: 'Priority', 
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff" stroke-width="2"><circle cx="12" cy="12" r="10" /></svg>', 
        count: tagCounts['Priority'] || 0 
      },
      { 
        id: 'spam', 
        name: 'Spam', 
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666666" stroke-width="2"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>', 
        count: tagCounts['Spam'] || 0 
      },
      { 
        id: 'networking', 
        name: 'Networking', 
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a66c2" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>', 
        count: tagCounts['Networking'] || 0 
      },
      { 
        id: 'sales', 
        name: 'Sales & Outreach', 
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5c6bc0" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>', 
        count: tagCounts['Sales & Outreach'] || 0 
      },
      { 
        id: 'needs-response', 
        name: 'Needs Response', 
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#057642" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>', 
        count: tagCounts['Needs Response'] || 0 
      },
      { 
        id: 'all', 
        name: 'All Messages', 
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666666" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>', 
      }
    ];
    
    filters.forEach(filter => {
      const button = document.createElement('button');
      button.className = 'filter-btn';
      button.dataset.filter = filter.name;
      button.innerHTML = `
        <span class="filter-icon" style="padding-bottom: 16px;">${filter.icon}</span>
        <span class="filter-name">${filter.name}</span>
        ${filter.name !== 'All Messages' ? `<span class="filter-count">${filter.count}</span>` : ''}
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
        
        // Call the provided click handler
        onFilterClick(filter.name === 'All Messages' ? null : filter.name);
      });
      
      elements.filterContainer.appendChild(button);
    });
  }

  export function displayFilteredMessages(processedMessages, activeFilter, elements, onMessageClick) {
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
  
      const tagColors = {
        'Priority': '#ff7700',
        'Spam': '#ff4d4d',
        'Networking': '#0a66c2',
        'Sales & Outreach': '#8e44ad', // Purple color for Sales & Outreach
        'Needs Response': '#27ae60'
      };
  
      // Create tag pills with specific background colors
      const tagPills = msg.tags.map(tag => {
        const tagClass = tag.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const bgColor = tagColors[tag] || '#e0e0e0'; // Default gray if tag not in mapping
        return `<span class="tag-pill ${tagClass}" style="background-color: ${bgColor}; color: white;">${tag}</span>`;
      }).join('');

  
      messageItem.innerHTML = `
        <div class="message-header">
          <span class="message-name">${msg.name}</span>
          <div class="message-tags">${tagPills}</div>
        </div>
        <div class="message-preview">${msg.preview}</div>
      `;

      console.log(messageItem);
  
      // Add click handler
      messageItem.addEventListener('click', () => onMessageClick(msg));
  
      elements.filteredMessages.appendChild(messageItem);
    });
  }
  
  /**
   * Shows an error message
   * @param {String} message - Error message to display
   * @param {Object} elements - UI elements
   */
  export function showError(message, elements) {
    elements.error.textContent = message;
    elements.error.style.display = "block";
    setTimeout(() => {
      elements.error.style.display = "none";
    }, 5000);
  }
  
  /**
   * Shows a success message
   * @param {String} message - Success message to display
   * @param {Object} elements - UI elements
   */
  export function showSuccess(message, elements) {
    const successEl = document.getElementById("success");
    successEl.textContent = message;
    successEl.style.display = "block";
    setTimeout(() => {
      successEl.style.display = "none";
    }, 3000);
  }