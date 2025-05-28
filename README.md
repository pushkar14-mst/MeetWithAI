# 🧠 MeetWithAI aka Whispr – AI-Powered Meeting Assistant

Whispr is a full-stack AI-powered meeting management platform that helps teams capture, analyze, and summarize meetings in real-time. Built with modern web technologies and seamless integrations, Whispr makes meetings more productive by turning conversations into actionable insights.

## 🚀 Tech Stack

- **Frontend:** React 18, TypeScript, Remix
- **Styling:** Tailwind CSS
- **Backend:** Firebase (Firestore + Auth)
- **AI Integration:** Gemini API (Google's Generative AI)
- **Calendar Integration:** Google Calendar API
- **Audio Processing:** Web Audio API, MediaRecorder

## 🧩 Key Features

- 🎙 **Real-Time Transcription**  
  Captures and transcribes meeting audio in real-time using the Web Audio API and Gemini AI.

- ✨ **AI-Powered Summarization**  
  Generates concise meeting summaries and action items using Gemini's LLM capabilities.

- 📅 **Google Calendar Sync**  
  Integrates with Google Calendar to fetch and manage scheduled meetings.

- 💬 **Live Meeting Interface**  
  Includes tabs for Transcript, Summary, Chat, and Notes for a focused meeting experience.

- 🔐 **Secure & Scalable**  
  Firebase Authentication and Firestore enable secure, real-time data sync and user management.

## 📸 Screenshots

> _(Insert your UI screenshots here: Dashboard, Summary Tab, Transcript Tab, etc.)_

## 🛠️ Developer Highlights

- Chunked audio processing with real-time noise cancellation.
- Modular component architecture with Remix for server-side rendering and optimized performance.
- Real-time updates via Firebase listeners.
- Designed mobile-responsive UI with Tailwind utility-first design.
- Focused on performance and scalability with chunked caching, lazy loading, and clean SSR.

## 📦 Installation & Setup

```bash
git clone https://github.com/your-username/whispr.git
cd whispr
npm install
npm run dev
```
