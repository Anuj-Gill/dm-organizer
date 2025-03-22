const groqModels = [
    "llama-3.1-8b-instant",
    "mistral-saba-24b",
    "llama3-8b-8192",
    "llama3-70b-8192",
    "deepseek-r1-distill-llama-70b",
    "llama-3.2-1b-preview",
    "llama-3.3-70b-versatile",
    "qwen-qwq-32b",
    "gemma2-9b-it",
    "whisper-large-v3-turbo",
    "deepseek-r1-distill-qwen-32b",
    "qwen-2.5-32b",
    "whisper-large-v3",
    "distil-whisper-large-v3-en",
    "llama-3.2-11b-vision-preview",
    "qwen-2.5-coder-32b",
    "llama-guard-3-8b",
    "llama-3.2-3b-preview",
    "allam-2-7b",
    "llama-3.2-90b-vision-preview",
    "llama-3.3-70b-specdec"
  ];
  
  const geminiModels = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
  ];
  
  const apiProviderSelect = document.getElementById('apiProvider');
  const modelSelect = document.getElementById('modelSelect');
  
  function updateModels() {
    const selectedProvider = apiProviderSelect.value;
    let models = [];
  
    if (selectedProvider === 'groq') {
      models = groqModels;
    } else if (selectedProvider === 'gemini') {
      models = geminiModels;
    } else if (selectedProvider === 'openai') {
      models = ["gpt-3.5-turbo", "gpt-4"];
    } else if (selectedProvider === 'anthropic') {
      models = ["claude-2", "claude-instant-1"];
    }
  
    modelSelect.innerHTML = '';
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      modelSelect.appendChild(option);
    });
  }
  
  // Delay the updateModels call slightly and attach event listener
  setTimeout(() => {
    updateModels();
    apiProviderSelect.addEventListener('change', updateModels);
  }, 100);
  
  // Add tooltips to paid options
//   const openaiOption = apiProviderSelect.querySelector('option[value="openai"]');
//   openaiOption.addEventListener('mouseover', () => {
//     openaiOption.title = 'OpenAI requires a paid account.';
//   });
  
//   const anthropicOption = apiProviderSelect.querySelector('option[value="anthropic"]');
//   anthropicOption.addEventListener('mouseover', () => {
//     anthropicOption.title = 'Anthropic requires a paid account.';
//   });
  
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
      // Update the model list based on the saved provider
      updateModels();
      // Set the model value if available.
      if (savedModel) {
        elements.modelSelect.value = savedModel;
      }
    } else {
      // If no saved provider, just update the model dropdown with the default.
      updateModels();
    }
  
    if (savedLinkedinUsername && savedUserName && savedApiKey) {
      elements.userGreeting.textContent = `Hello, ${savedUserName}!`;
      elements.userGreeting.style.display = 'block';
      elements.fetchButton.disabled = false;
    }
  }