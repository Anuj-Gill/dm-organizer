
export function saveUserInfo(linkedinUsername, userName, messages) {
    localStorage.setItem('linkedinUsername', linkedinUsername);
    localStorage.setItem('userName', userName);
  }
  
  export function loadUserInfo() {
    return {
      linkedinUsername: localStorage.getItem('linkedinUsername'),
      userName: localStorage.getItem('userName'),
      messages: localStorage.getItem('messages')   
    };
  }
  
  export function clearUserInfo() {
    localStorage.removeItem('linkedinUsername');
    localStorage.removeItem('userName');
  }

  export function saveUserMessages(messages) {
    localStorage.setItem('messages', JSON.stringify(messages));
  }