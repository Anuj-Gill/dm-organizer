# LinkedIn DM Organizer

A browser extension that helps LinkedIn users prioritize and organize their direct messages using AI.

## 🔍 Overview

LinkedIn DM Organizer solves the problem of managing high volumes of LinkedIn messages by automatically categorizing and prioritizing conversations. The extension analyzes message content and applies tags to help users focus on what matters most.

## 🌟 Features

- **Intelligent Categorization**: Automatically tags messages as Priority, Spam, Networking, Sales, or Needs Response
- **Custom Priority Filters**: Define what matters most to you
- **Privacy-First Design**: No message content is stored in any database
- **Fast Processing**: Redis caching for quick results
- **Efficient AI Analysis**: Uses batched requests to Groq API (llama-3.3-70b-versatile)

## 🏗️ Architecture

### Extension (Frontend)
- Vanilla JavaScript browser extension
- Extracts message data from LinkedIn DOM
- Simple, intuitive UI for message categorization
- Minimal permissions required

### Server (Backend)
- Express.js + TypeScript
- Redis for caching results (10-minute TTL)
- Groq API integration with llama-3.3-70b-versatile model
- Winston for structured logging
- Docker support for easy deployment

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- Redis instance(Configured for Upstash redis instance)
- Groq API key

### Server Setup
1. Navigate to the server directory
   ```bash
   cd server
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   DATABASE_URL=
   PORT=3000
   FRONTEND_URL=chrome-extension://gecmgbcingenofgkdcmceooknpefflfd
   GROQ_API_KEY=
   UPSTASH_REDIS_REST_URL=
   UPSTASH_REDIS_REST_TOKEN=

   ```

4. Start the server
   ```bash
   npm run dev
   ```

### Extension Setup
1. Navigate to the extension directory
   ```bash
   cd extension
   ```

2. Load the extension in your browser:
   - Chrome: Go to `chrome://extensions/`, enable Developer mode, and click "Load unpacked"
   - Firefox: Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select the `manifest.json` file

## 🔐 Privacy & Security

- Only sender names and last message content are processed
- No message content is stored in databases
- Only message IDs and assigned tags are cached (10-minute TTL)

## 🧰 Technical Details

### Message Processing Flow
1. User inputs LinkedIn username and optional priority keywords
2. Extension extracts message data from LinkedIn DOM
3. Data is sent to backend API
4. Backend checks Redis cache for recent results
5. If not cached or custom priorities specified, messages are analyzed using Groq API
6. Results are cached and returned to extension
7. Extension displays categorized messages in UI

### Tagging System
Messages can receive multiple tags:
1. **Priority** - Job offers, internships, urgent professional matters, or custom priorities
2. **Spam** - Unwanted promotions, mass outreach, irrelevant content
3. **Networking** - Connection requests, introductions, casual professional conversations
4. **Sales & Outreach** - Cold outreach selling services, products, business pitches
5. **Needs Response** - Messages requiring a reply or follow-up

## 🚧 Limitations & Future Improvements

- Cannot directly open specific conversations due to LinkedIn's DOM structure
- Currently relying on sender usernames for identification (potential for collisions)

## 📄 License

MIT

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](github.com/your-repo/issues).