export function saveUserInfo(linkedinUsername, userName, apiKey, apiProvider, model) {
  localStorage.setItem('linkedinUsername', linkedinUsername);
  localStorage.setItem('userName', userName);
  localStorage.setItem('apiKey', apiKey);
  localStorage.setItem('apiProvider', apiProvider);
  localStorage.setItem('model', model);
}

export function loadUserInfo() {
  return {
    linkedinUsername: localStorage.getItem('linkedinUsername'),
    userName: localStorage.getItem('userName'),
    messages: localStorage.getItem('messages'),
    apiKey: localStorage.getItem('apiKey'),
    apiProvider: localStorage.getItem('apiProvider'),
    model: localStorage.getItem('model'),
  };
}

export function clearUserInfo() {
  localStorage.removeItem('linkedinUsername');
  localStorage.removeItem('userName');
  localStorage.removeItem('apiKey');
  localStorage.removeItem('apiProvider');
  localStorage.removeItem('model');
}

export function saveUserMessages(messages) {
  localStorage.setItem('messages', JSON.stringify(messages));
}