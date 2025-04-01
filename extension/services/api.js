const API_ENDPOINT = "https://dm-organizer.onrender.com/api/message/process";

export async function sendToAPI(formattedMessages, originalMessages, elements, onSuccess, onError) {
  console.log("Sending data to API:", JSON.stringify({ messages: formattedMessages }));
  
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        messages: formattedMessages, 
        username: elements.linkedinUsernameInput.value, 
        priority: elements.priorityInupt.value,
        apiConfig: {model: elements.modelSelect.value, apiKey: elements.apiKeyInput.value, provider: elements.apiProviderSelect.value}
      }),
      signal: AbortSignal.timeout(10000)
    });
    
    console.log("API response status:", response.status);
    
    if (!response.ok) {
      // Parse error response to get the detailed error message
      const errorData = await response.json();
      throw new Error(errorData.error || `API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log("API Response data:", data);
    onSuccess(data, originalMessages);
  } catch (err) {
    onError(err.message || "Unable to reach API. Please try again later.");
  }
}
export function processApiResponseData(data, originalMessages) {
  return originalMessages.map(conv => {
    const tagInfo = data.tags.find(t => t.messageId === conv.messageId);
    const tags = tagInfo ? tagInfo.tags : [];

    return {
      name: conv.messageId,
      preview: conv.content,
      tags: tags
    };
  });
}