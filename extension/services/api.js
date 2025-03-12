const API_ENDPOINT = "http://localhost:3000/api/message/process";

export function sendToAPI(formattedMessages, originalMessages, elements, onSuccess, onError) {
  console.log("Sending data to API:", JSON.stringify({ messages: formattedMessages }));
      
  fetch(API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ 
      messages: formattedMessages, 
      username: elements.linkedinUsernameInput.value, 
      priority: elements.priorityInupt.value 
    }),
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
    onSuccess(data, originalMessages);
  })
  .catch(err => {
    console.error("API Error:", err);
    onError("Unable to reach API. Please try again later.");
  });
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