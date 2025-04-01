# Sort It Out

A browser extension that helps LinkedIn users prioritize and organize their direct messages using AI.

## 🚀 Try It Now

Want to declutter your LinkedIn inbox instantly? Install **Sort It Out** and get your messages automatically categorized!

🔗 **[Chrome Extension Link](https://chromewebstore.google.com/detail/sort-it-out/bjnbbgnocjpecapgkioklbgghjgaleno)**

## 🔍 Overview

Keeping track of important messages on LinkedIn is a hassle. **Sort It Out** solves this by **auto-organizing your DMs** so you can focus on what truly matters.

🔹 Just install the extension, add your details and API key (Groq or Gemini), choose a model, and boom—your **conversations are neatly sorted into categories**.

I’d love to keep adding more features, so I’ve **open-sourced it**! Feel free to contribute: [GitHub Repository](https://github.com/Anuj-Gill/dm-organizer).

## 🌟 Features

- **Smart Categorization** – Messages are tagged as Priority, Spam, Networking, Sales, or Needs Response
- **Custom Priority Filters** – Define what matters most to you
- **Privacy First** – No message content is stored
- **Fast Processing** – Uses Redis caching for quick results
- **Choose Your AI** – Supports both **Groq** and **Gemini** models

## 🏗️ How It Works

1. **Extracts messages** from LinkedIn’s DOM
2. **Sends data to the backend** for AI analysis
3. **Checks Redis cache** for recent results
4. **Uses AI (Groq/Gemini) to categorize** messages
5. **Displays sorted messages** in the extension UI

## 🔧 Setting Up Locally (For Contributors)

If you want to set up **Sort It Out** on your own machine and contribute, follow these steps:

### Prerequisites
- Node.js 16+
- A Redis instance (Configured for Upstash Redis)
- Groq or Gemini API key

### Server Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file and add your credentials:
   ```
   DATABASE_URL=
   PORT=3000
   FRONTEND_URL=chrome-extension://gecmgbcingenofgkdcmceooknpefflfd
   API_KEY=your_groq_or_gemini_key
   UPSTASH_REDIS_REST_URL=
   UPSTASH_REDIS_REST_TOKEN=
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

### Extension Setup

1. Navigate to the extension directory:
   ```bash
   cd extension
   ```

2. Load the extension in your browser:
   - **Chrome:** Go to `chrome://extensions/`, enable Developer mode, and click "Load unpacked"
   - **Firefox:** Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select the `manifest.json` file

## 🔐 Privacy & Security

- Only sender names and last message content are processed
- No message content is stored in databases
- Only message IDs and assigned tags are cached (10-minute TTL)
- Users can provide their own API key (Groq or Gemini)

## 🏷️ Message Categories

Messages are sorted into the following:
1. **Priority** – Job offers, internships, urgent professional matters, or custom priorities
2. **Spam** – Unwanted promotions, mass outreach, irrelevant content
3. **Networking** – Connection requests, introductions, casual professional conversations
4. **Sales & Outreach** – Cold outreach selling services, products, business pitches
5. **Needs Response** – Messages requiring a reply or follow-up

## 🚧 Limitations & Future Improvements

- Currently, it cannot directly open specific LinkedIn DMs due to LinkedIn's restrictions
- Identification relies on sender usernames, which may cause occasional mismatches

## 📄 License

MIT

## 🤝 Contributing

I’d love to keep improving **Sort It Out**! If you have feature ideas or want to contribute, check out the [issues page](https://github.com/Anuj-Gill/dm-organizer/issues) and submit a PR!

