# 🚀 IntelliBoard 360

> An AI-powered collaborative smart whiteboard that combines real-time collaboration, intelligent learning tools, gesture recognition, OCR, quizzes, mind maps, and AI assistance into one interactive platform.

![React](https://img.shields.io/badge/React-18-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![Python](https://img.shields.io/badge/Python-FastAPI-yellow)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen)
![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-black)
![License](https://img.shields.io/badge/License-MIT-blue)

---

# 📖 Overview

IntelliBoard 360 is a next-generation collaborative digital whiteboard designed for students, educators, and teams. It enables multiple users to collaborate in real time while leveraging AI-powered tools for learning, productivity, and content creation.

The platform integrates advanced features such as:

- 🧠 AI Assistant
- ✍️ OCR Text Recognition
- 🎤 Text-to-Speech
- 🌍 Language Translation
- 📑 Smart Summarization
- 🧩 Quiz Generator
- 🗺️ Mind Map Generator
- 📊 Diagram Generation
- ✋ Hand Gesture Recognition
- 😊 Face Recognition
- 👥 Real-time Collaboration
- 💾 Whiteboard Export & Saving

---

# ✨ Features

## 🎨 Smart Whiteboard
- Infinite drawing canvas
- Multiple drawing tools
- Shapes
- Text
- Sticky notes
- Image uploads
- PDF Export
- Canvas snapshots

---

## 👥 Real-Time Collaboration

- Live multi-user editing
- Socket.io synchronization
- Shared sessions
- Instant updates
- Collaborative whiteboard

---

## 🤖 AI Features

### 📝 OCR
Extract text from uploaded images.

### 📄 Summarization
Generate concise summaries from large text.

### 🌍 Translation
Translate content into multiple languages.

### 🎤 Text-to-Speech
Convert written content into speech.

### ❓ Quiz Generator
Automatically create quizzes from notes.

### 🗺️ Mind Map Generator
Generate structured mind maps using AI.

### 📊 Diagram Generator
Create flowcharts and diagrams from prompts.

### 💬 AI Chat
Integrated Gemini/Groq powered assistant.

---

## ✋ Computer Vision

- Gesture Recognition
- Face Recognition
- AI-powered image processing

---

## 📚 Education Features

- Courses
- Assignments
- Attendance
- Tests
- Session Management
- Archive System

---

# 🏗️ Project Architecture

```
IntelliBoard
│
├── client/              React + Vite Frontend
│
├── server/              Node.js + Express Backend
│
└── ai-service/          FastAPI AI Microservice
```

---

# 🛠️ Tech Stack

## Frontend

- React 18
- Vite
- JavaScript
- Tailwind CSS
- Framer Motion
- Axios
- React Router
- HTML2Canvas
- jsPDF

---

## Backend

- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Socket.io
- Express Middleware
- Helmet
- Morgan

---

## AI Service

- FastAPI
- Python
- Google Gemini API
- Groq API
- OCR Processing
- OpenCV
- Face Recognition
- Gesture Recognition

---

## Database

- MongoDB

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/IntelliBoard.git

cd IntelliBoard
```

---

# Frontend Setup

```bash
cd client

npm install

npm run dev
```

Runs on:

```
http://localhost:5173
```

---

# Backend Setup

```bash
cd server

npm install

npm run dev
```

Runs on:

```
http://localhost:5000
```

---

# AI Service Setup

```bash
cd ai-service

pip install -r requirements.txt

python main.py
```

Runs on:

```
http://localhost:8000
```

---

# 🔑 Environment Variables

## Client

```
VITE_API_URL=

VITE_SOCKET_URL=
```

---

## Server

```
PORT=

MONGO_URI=

JWT_SECRET=

CLIENT_URL=

GEMINI_API_KEY=

GROQ_API_KEY=
```

---

## AI Service

```
GEMINI_API_KEY=

GROQ_API_KEY=
```

---

# 📁 Folder Structure

```
IntelliBoard
│
├── ai-service
│   ├── routers
│   ├── services
│   ├── models
│   ├── utils
│   └── main.py
│
├── client
│   ├── src
│   ├── public
│   └── package.json
│
├── server
│   ├── routes
│   ├── middleware
│   ├── models
│   ├── socket
│   ├── config
│   ├── controllers
│   └── server.js
│
└── README.md
```

---

# 🚀 Future Improvements

- Video conferencing
- Voice collaboration
- AI code generation
- Whiteboard templates
- Cloud storage integration
- Version history
- Mobile application
- Offline mode

---


# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature-name
```

3. Commit changes

```bash
git commit -m "Added new feature"
```

4. Push

```bash
git push origin feature-name
```

5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Kartik Mishra**

- GitHub: https://github.com/yourusername
- LinkedIn: https://linkedin.com/in/yourprofile

---

## ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub!

```

### This README includes:
- ✅ Professional GitHub formatting
- ✅ Project overview
- ✅ Architecture
- ✅ Features
- ✅ Installation guide
- ✅ Folder structure
- ✅ Tech stack
- ✅ Future scope
- ✅ Contributing section
- ✅ Clean badges
- ✅ Recruiter-friendly presentation

..Thank you..
