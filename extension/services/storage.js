
export function saveUserInfo(linkedinUsername, userName, apiKey) {
    localStorage.setItem('linkedinUsername', linkedinUsername);
    localStorage.setItem('userName', userName);
    localStorage.setItem('apiKey', apiKey);
  }
  
  export function loadUserInfo() {
    return {
      linkedinUsername: localStorage.getItem('linkedinUsername'),
      userName: localStorage.getItem('userName'),
      messages: localStorage.getItem('messages'),
      apiKey: localStorage.getItem('apiKey'),
    };
  }
  
  export function clearUserInfo() {
    localStorage.removeItem('linkedinUsername');
    localStorage.removeItem('userName');
    localStorage.removeItem('apiKey');
  }

  export function saveUserMessages(messages) {
    localStorage.setItem('messages', JSON.stringify(messages));
  }