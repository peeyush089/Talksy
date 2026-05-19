<div align="center">

<img src="screenshots/chat.png" alt="TALKSY Banner" width="100%" style="border-radius:12px"/>

<br/><br/>

# 💬 TALKSY
### Real-Time Full-Stack Chat Application

<p align="center">
  <img src="https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
</p>

<p align="center">
  <a href="https://talksy-taupe.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/🚀 Live Demo-Click Here-FF6B6B?style=for-the-badge" />
  </a>
</p>

> **TALKSY** is a production-ready, full-stack real-time chat application built with the MERN stack. It supports instant messaging, friend management, group chats, image sharing, voice messages, and live online status — all wrapped in a beautiful, responsive UI with 32 switchable themes.

</div>

---

## 📸 Screenshots

<table>
  <tr>
    <td align="center"><b>🔐 Login Page</b></td>
    <td align="center"><b>💬 Chat Window</b></td>
    <td align="center"><b>👤 Profile Page</b></td>
  </tr>
  <tr>
    <td><img src="screenshots/login_png.png" width="100%" alt="Login"/></td>
    <td><img src="screenshots/chat.png" width="100%" alt="Chat"/></td>
    <td><img src="screenshots/profile.png" width="100%" alt="Profile"/></td>
  </tr>
</table>

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **JWT Authentication** | Secure signup & login with token-based auth stored in localStorage |
| ⚡ **Real-Time Messaging** | Instant bidirectional communication via Socket.io WebSockets |
| 👥 **Friend System** | Send, accept & manage friend requests with live bell notifications |
| 💬 **Group Chats** | Create and manage group conversations with multiple users |
| 🖼️ **Media Sharing** | Send images and voice messages in chat via Cloudinary CDN |
| 🟢 **Online Presence** | Live online/offline status indicators for all users |
| 🔔 **Push Notifications** | Real-time friend request alerts with animated badge counter |
| 🎨 **32 UI Themes** | Full theme switcher powered by DaisyUI — light, dark & more |
| ✏️ **Editable Profile** | Inline edit name, username, email and profile picture |
| 📱 **Fully Responsive** | Optimized for mobile, tablet and desktop screens |
| 🔒 **Cross-Domain Auth** | Secure token auth working across Vercel + Render deployment |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 + Vite | UI framework with fast HMR build tool |
| TailwindCSS + DaisyUI | Utility-first styling with 32 pre-built themes |
| Framer Motion | Smooth animations and micro-interactions |
| Zustand | Lightweight global state management |
| Socket.io Client | Real-time WebSocket connection |
| Axios | HTTP client with request interceptors |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | NoSQL database with schema modeling |
| Socket.io | WebSocket server for real-time events |
| JWT + bcrypt | Authentication and password hashing |
| Cloudinary | Cloud storage for images and media |

### DevOps & Deployment
| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting with auto-deploy |
| Render | Backend hosting |
| MongoDB Atlas | Cloud database (M0 free cluster) |
| UptimeRobot | Server uptime monitoring (prevents sleep) |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (Vercel)                   │
│              React + Vite + TailwindCSS             │
│         Zustand State │ Framer Motion UI            │
└──────────────────┬──────────────────────────────────┘
                   │  HTTP (Axios + JWT Bearer Token)
                   │  WebSocket (Socket.io)
┌──────────────────▼──────────────────────────────────┐
│                  SERVER (Render)                    │
│              Node.js + Express.js                   │
│     REST API Routes │ Socket.io Events              │
│     JWT Middleware  │ CORS Handler                  │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼──────┐    ┌─────────▼────────┐
│ MongoDB Atlas│    │   Cloudinary CDN │
│  (Database)  │    │  (Media Storage) │
└──────────────┘    └──────────────────┘
```

---

## 📁 Project Structure

```
talksy/
├── 📁 frontend/
│   ├── 📁 src/
│   │   ├── 📁 components/      # Navbar, Sidebar, ChatWindow, ChatHeader
│   │   ├── 📁 pages/           # Home, Login, Signup, Profile, Settings
│   │   ├── 📁 store/           # Zustand: useAuthStore, useChatStore, useFriendStore
│   │   └── 📁 lib/             # axios.js, utils
│   ├── .env
│   └── package.json
│
├── 📁 backend/
│   ├── 📁 src/
│   │   ├── 📁 controllers/     # auth, message, friend, group, call
│   │   ├── 📁 models/          # User, Message, Group mongoose schemas
│   │   ├── 📁 routes/          # API route definitions
│   │   ├── 📁 middleware/       # protectRoute (JWT auth)
│   │   └── 📁 lib/             # db.js, socket.js, cloudinary.js
│   ├── .env
│   └── package.json
│
├── 📁 screenshots/             # README screenshots
└── README.md
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Cloudinary account

### 1. Clone the repository
```bash
git clone https://github.com/peeyush089/Talksy.git
cd Talksy
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5001
```

```bash
npm run dev
```

### 4. Visit
```
http://localhost:5173
```

---

## 🌐 Live Deployment

| Layer | Platform | URL |
|-------|---------|-----|
| **Frontend** | Vercel | [talksy-taupe.vercel.app](https://talksy-taupe.vercel.app) |
| **Backend** | Render | [talksy-voh9.onrender.com](https://talksy-voh9.onrender.com) |
| **Database** | MongoDB Atlas | Cloud hosted |

---

## 🔑 API Endpoints

### Auth Routes `/api/auth`
| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| POST | `/signup` | Register new user | ❌ |
| POST | `/login` | Login user, returns JWT | ❌ |
| POST | `/logout` | Logout user | ✅ |
| GET | `/check` | Verify token & get user | ✅ |
| PUT | `/update-profile` | Update profile info | ✅ |

### Message Routes `/api/messages`
| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| GET | `/users` | Get all users | ✅ |
| GET | `/:id` | Get messages with user | ✅ |
| POST | `/send/:id` | Send a message | ✅ |

### Friend Routes `/api/friends`
| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| GET | `/list` | Get friends list | ✅ |
| GET | `/requests` | Get pending requests | ✅ |
| POST | `/request/:id` | Send friend request | ✅ |
| POST | `/accept/:id` | Accept friend request | ✅ |

---

## 👨‍💻 Author

<div align="center">

### Peeyush
**B.Tech Computer Science Engineer**
**MERN Stack Developer**

[![GitHub](https://img.shields.io/badge/GitHub-peeyush089-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/peeyush089)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)]([https://www.linkedin.com/in/peeyush-yadav-02441a3a1/)

</div>

---

## 📄 License

Distributed under the **MIT License** — see [`LICENSE`](LICENSE) for details.

---

<div align="center">

### ⭐ If you found this project impressive, please star it!

*Built with passion by a fresh B.Tech CSE graduate*
*Open to full-time opportunities & collaborations* 🚀

</div>
