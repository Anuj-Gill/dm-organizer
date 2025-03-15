import axios from "axios";
import { miscConfig } from "../config";
import { Redis } from '@upstash/redis';
import logger from "../utils/logger.utils";

const redis = new Redis({
  url: miscConfig.redisUrl,
  token: miscConfig.redisToken,
});

interface Message {
  messageId: string;
  content: string;
}

interface CategorizedMessage {
  messageId: string;
  tags: string[];
}

interface CategoryResponse {
  tags: CategorizedMessage[];
}

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile"; 
const BATCH_SIZE = 10; // Number of messages to process in each batch

const createSystemPrompt = (messages: Message[], priorityPrompt: string): string => { 
  return `You are an AI assistant that categorizes LinkedIn direct messages by priority and intent.

${priorityPrompt ? `**Priority Definition:** ${priorityPrompt}\n` : ''}

Please analyze each message and assign ONLY from these five specific category names:

VALID CATEGORIES (USE EXACTLY AS WRITTEN):
- "Priority"
- "Spam"
- "Networking"
- "Sales & Outreach"
- "Needs Response"

Category definitions:
1. Priority: ${priorityPrompt || "Job offers, internships, urgent professional matters"}
2. Spam: Unwanted promotions, mass outreach, irrelevant content.
3. Needs Response: Messages requiring a reply or follow-up, including genuine inquiries with resumes, project links, or detailed information.
4. Sales & Outreach: Cold outreach selling services, products, business pitches, Linkedin offers etc.
5. Networking: Connection requests, introductions, casual conversations.

CRITICAL INSTRUCTIONS:
- Use ONLY the exact category names listed above - do not modify or combine them with descriptions
- INCORRECT: "Priority - networking", "Priority/Urgent", "Spam message"
- CORRECT: "Priority", "Spam", "Networking", etc.
- Do not create new categories or variations
- Assign at least one category to each message
- A message can have multiple categories if appropriate (e.g., both "Priority" and "Needs Response")
- Return only valid JSON with this structure: {"tags": [{"messageId": "id", "tags": ["Category1", "Category2"]}, ...]}

Example of CORRECT response format:
{"tags": [
  {"messageId": "123", "tags": ["Priority", "Needs Response"]},
  {"messageId": "456", "tags": ["Spam"]},
  {"messageId": "789", "tags": ["Networking", "Sales & Outreach"]}
]}

Messages to categorize:
${JSON.stringify({ messages }, null, 2)}`;
};

const parseApiResponse = (responseContent: string): CategoryResponse => {
  try {
    
    if (!responseContent) {
      return { tags: [] };
    }
    
    let cleanedResponse = responseContent;
    if (cleanedResponse.includes("```")) {
      const jsonBlockRegex = /`(?:json)?\s*([\s\S]*?)`/;
      const match = cleanedResponse.match(jsonBlockRegex);
      
      if (match && match[1]) {
        cleanedResponse = match[1].trim();
      } else {
        cleanedResponse = cleanedResponse.replace(/```(?:json)?/g, "").trim();
      }
    }
    
    let jsonStartIndex = cleanedResponse.indexOf('{');
    if (jsonStartIndex !== -1) {
      cleanedResponse = cleanedResponse.substring(jsonStartIndex);
    }
    
    const recoveredTags: CategorizedMessage[] = [];
   
    const messageObjectPattern = /\{\s*"messageId"\s*:\s*"([^"]+)"\s*,\s*"tags"\s*:\s*\[((?:"[^"]+")(?:\s*,\s*"[^"]+")*)\]/g;
    let match;
    
    while ((match = messageObjectPattern.exec(cleanedResponse)) !== null) {
      const messageId = match[1];
      const tagsString = match[2];
      
      const tags: string[] = [];
      const tagPattern = /"([^"]+)"/g;
      let tagMatch;
      
      while ((tagMatch = tagPattern.exec(tagsString)) !== null) {
        const tag = tagMatch[1];
        // Validate that the tag is one of the allowed categories
        if (["Priority", "Spam", "Networking", "Sales & Outreach", "Needs Response"].includes(tag)) {
          tags.push(tag);
        } else {
          console.warn(`Invalid tag "${tag}" found for message ${messageId}, ignoring`);
        }
      }
      
      recoveredTags.push({
        messageId,
        tags
      });
    }
    
    if (recoveredTags.length > 0) {
      return { tags: recoveredTags };
    }

    try {
      let openBraces = 0, openBrackets = 0;
      let isInString = false;
      let fixedJson = '';
      
      for (let i = 0; i < cleanedResponse.length; i++) {
        const char = cleanedResponse[i];
        fixedJson += char;
        
        if (char === '"' && (i === 0 || cleanedResponse[i - 1] !== '\\')) {
          isInString = !isInString;
        }
        
        if (!isInString) {
          if (char === '{') openBraces++;
          else if (char === '}') openBraces--;
          else if (char === '[') openBrackets++;
          else if (char === ']') openBrackets--;
        }
      }
      
      while (openBrackets > 0) {
        fixedJson += ']';
        openBrackets--;
      }
      
      while (openBraces > 0) {
        fixedJson += '}';
        openBraces--;
      }
      
      const parsedResponse = JSON.parse(fixedJson);
      
      if (parsedResponse.tags && Array.isArray(parsedResponse.tags)) {
        // Filter out any invalid tags in the parsed response
        parsedResponse.tags = parsedResponse.tags.map((item: CategorizedMessage) => {
          return {
            messageId: item.messageId,
            tags: item.tags.filter(tag => 
              ["Priority", "Spam", "Networking", "Sales & Outreach", "Needs Response"].includes(tag)
            )
          };
        });
        
        return parsedResponse;
      }
    } catch (fixError) {
      console.error("Failed to parse fixed JSON:", fixError);
    }
    
    return { tags: [] };
    
  } catch (parseError) {
    console.error("Failed to parse API response:", parseError);
    return { tags: [] };
  }
};

// Process a single batch of messages
const processBatch = async (messageBatch: Message[], priorityPrompt: string, apiKey: string): Promise<{data: CategorizedMessage[], error?: {status: number, message: string}}> => {
  try {
    const systemPrompt = createSystemPrompt(messageBatch, priorityPrompt);

    const response = await axios.post(
      API_URL,
      {
        model: MODEL,
        messages: [{ role: "system", content: systemPrompt }],
        max_tokens: 500,  
        temperature: 0.2,  
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`, 
        },
      }
    );

    const responseContent = response.data.choices[0]?.message?.content;
    if (!responseContent) {
      console.warn("Empty response from API for batch");
      return {
        data: [],
        error: {
          status: 422,
          message: "Empty response from Groq API"
        }
      };
    }

    const parsedResponse = parseApiResponse(responseContent);
    return { data: parsedResponse.tags };
  } catch (error: any) {
    console.error(`Error processing batch: ${error.message}`);
    if (error.response) {
      if (error.response.status === 401) {
        return {
          data: [],
          error: {
            status: 401,
            message: "Authentication failed. Please check your API key."
          }
        };
      }
      
      if (error.response.status === 404) {
        return {
          data: [],
          error: {
            status: 404,
            message: "API endpoint not found. Please verify the API URL."
          }
        };
      }
    }
    
    return {
      data: [],
      error: { 
        status: error.response?.status || 500, 
        message: error.response?.data?.error?.message || error.message 
      }
    };
  }
};

// Main function with batching implementation
const categorizeLinkedInMessages = async (
  messages: Message[], 
  priorityPrompt: string, 
  username: string, 
  apiKey: string
): Promise<{tags?: CategorizedMessage[], error?: {status: number, message: string}}> => {
  try {
    // Process messages in batches
    const allResults: CategorizedMessage[] = [];
    let batchError = null;
    
    // Split messages into batches of BATCH_SIZE
    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const messageBatch = messages.slice(i, i + BATCH_SIZE);
      logger.info(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(messages.length/BATCH_SIZE)} for user: ${username}`);
      
      const result = await processBatch(messageBatch, priorityPrompt, apiKey);
      
      if (result.error) {
        batchError = result.error;
        break;
      }
      
      allResults.push(...result.data);
    }

    if (batchError) {
      return { error: batchError };
    }

    const finalResponse = { tags: allResults };
    
    // Cache the results
    logger.info(`Categorized ${allResults.length} messages for user: ${username}`);
    await redis.set(username, finalResponse, { ex: 600 });
    
    return finalResponse;
  } catch (error: any) {
    if (error.response) {
      console.error("API Error:", {
        status: error.response.status,
        data: error.response.data
      });
      
      
      return {
        error: {
          status: error.response.status,
          message: error.response.data?.error?.message || "API error occurred"
        }
      };
    } else if (error.request) {
      console.error("Network Error - No response received");
      return {
        error: {
          status: 503,
          message: "Network error. Please check your internet connection."
        }
      };
    }
    
    return {
      error: {
        status: 500,
        message: error.message || "Unknown error occurred"
      }
    };
  }
};

export { categorizeLinkedInMessages, type Message, type CategoryResponse };