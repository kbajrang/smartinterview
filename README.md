# 🎯 Smart Interview System

A real-time **technical interview platform** supporting **video calling**, **live collaborative code editor**, **speech transcription recording**, and **real-time code execution**.

---

## 📜 Overview

Smart Interview System connects interviewers and candidates in a shared room where they:
- Conduct a live video call
- Solve coding problems collaboratively
- Post questions dynamically
- Compile and execute code in real time
- Record conversations and generate transcripts for evaluation

---

## 🚀 Features

- 🔥 Room-based secure video calling (WebRTC)
- 💬 Real-time collaborative coding editor (Monaco Editor)
- 📜 Live question posting and updates
- ⚙️ Code compilation and execution (Java, C++, Python, JavaScript)
- 📝 Speech-to-Text transcript recording
- 🧠 Future LLM integration for automatic interview evaluation

---

## ⚙️ Tech Stack

| Layer | Technology |
|:---|:---|
| Frontend | ReactJS (Vite), Socket.IO-client, Monaco Editor |
| Backend | Node.js (Express), Socket.IO |
| Video/Audio | WebRTC |
| Code Execution | Piston API |
| Speech Recognition | Web Speech API |
| Deployment | Local / Render |

---

## 🏁 Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run in Development
```bash
npm run dev
```

### 4. Deploying to Render
1. Create a **Web Service** on [Render](https://render.com/) and connect this repository.
2. Set the **Build Command** to `npm run build`.
3. Set the **Start Command** to `npm start` so the backend serves the built frontend on one port.
4. Configure environment variables `MONGO_URI`, `MAIL_USER`, and `MAIL_PASS`.
5. Deploy to obtain a public URL.

Transcripts are stored in MongoDB in the `Transcript` collection.
