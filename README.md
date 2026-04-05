# JustChat 🎥💬

A real-time video conferencing and chat application built with React, Node.js, WebRTC, and Socket.io — similar to Google Meet.


---

## 🚀 Live Demo

🌐 [justchatfrontend-iieu.onrender.com](https://justchatfrontend-iieu.onrender.com)

---

## 📌 Features

- 🎥 **Real-time Video Calling** — peer-to-peer video calls using WebRTC
- 🎙️ **Audio Support** — mic toggle with mute/unmute
- 💬 **In-Call Chat** — send and receive messages during a call
- 🖥️ **Screen Sharing** — share your screen with all participants
- 👥 **Multi-user Rooms** — multiple users can join the same room via URL
- 🔐 **Authentication** — register and login with JWT tokens
- 🔇 **Camera/Mic Controls** — toggle video and audio on/off
- 📱 **Responsive UI** — works on desktop and mobile browsers
- 🔴 **End Call** — cleanly disconnects and redirects to home

---

## 🛠️ Tech Stack

**Frontend**
- React.js (Vite)
- Material UI (MUI)
- React Icons
- Socket.io Client
- WebRTC (native browser API)
- React Router DOM
- Axios

**Backend**
- Node.js
- Express.js
- Socket.io
- MongoDB (Mongoose)
- JSON Web Tokens (JWT)
- bcrypt (password hashing)
- CORS

---

## 📁 Project Structure

```
JustChat/
├── frontend/
│   ├── public/
│   │   ├── logo.png
│   │   ├── mobile.png
│   │   └── form.jpg
│   └── src/
│       ├── contexts/
│       │   └── AuthContext.jsx       # Auth state management
│       ├── pages/
│       │   ├── Landing.jsx           # Landing/home page
│       │   ├── Auth.jsx              # Login & Register
│       │   ├── Home.jsx              # Dashboard
│       │   ├── VideoMeet.jsx         # Video call room
│       │   └── History.jsx           # Call history
│       ├── utils/
│       │   └── withAuth.jsx          # Protected route HOC
│       ├── App.jsx
│       ├── App.css
│       └── videoMeet.css
│
└── backend/
    ├── controllers/
    │   └── socketManager.js          # Socket.io & WebRTC signaling
    ├── models/
    │   └── user.model.js             # MongoDB user schema
    ├── routes/
    │   └── users.routes.js           # Auth API routes
    └── app.js                        # Express server entry point
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- A modern browser (Chrome recommended for WebRTC)

### 1. Clone the repository

```bash
git clone https://github.com/Vishal777956/JustChat.git
cd JustChat
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the backend folder:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

Start the backend server:

```bash
npm start
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will run at `http://localhost:5173`

---

## 🔌 How It Works

### Authentication Flow
```
User registers/logs in → JWT token saved to localStorage → 
Protected routes check token → Redirect if not authenticated
```

### Video Call Flow
```
User enters a room URL → Camera/mic permissions requested →
Socket connects to server → Room joined via URL as room ID →
WebRTC peer connections established between all users →
Video/audio streams exchanged directly between browsers
```

### WebRTC Signaling
```
User A joins → Server notifies everyone →
A creates RTCPeerConnection → Sends SDP offer via Socket.io →
B receives offer → Sends SDP answer back →
ICE candidates exchanged via STUN server →
Direct peer-to-peer connection established ✅
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/users/register` | Register a new user |
| POST | `/api/v1/users/login` | Login and receive JWT token |
| GET | `/api/v1/users/history` | Get call history (protected) |

---

## 🔒 Environment Variables

**Backend `.env`**

```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_here
PORT=3000
```

---

## 📸 Screenshots

### Landing Page
> Clean landing page with call-to-action to get started
<img width="1915" height="860" alt="image" src="https://github.com/user-attachments/assets/32a82903-11f4-44fc-a8e0-6e22c549d10f" />


### Login / Register
> Split-screen auth page with background image
> <img width="1919" height="862" alt="image" src="https://github.com/user-attachments/assets/4a5ff287-c5da-4b3b-a660-1e4039dc7bcf" />

### Room Joining Lobby

> <img width="1917" height="870" alt="image" src="https://github.com/user-attachments/assets/4489dfae-3590-42e1-9094-468cf330231a" />
> <img width="1914" height="855" alt="image" src="https://github.com/user-attachments/assets/c5b3799e-eb1b-4b34-bf28-3a75da449bd9" />


### Video Call Room
> Multi-user video grid with controls for camera, mic, screen share, and chat
><img width="1918" height="966" alt="image" src="https://github.com/user-attachments/assets/a855bba2-6db8-47e4-a51d-9a9f4bd4c4d6" />




---

## 🚧 Known Limitations

- WebRTC requires HTTPS in production (handled automatically by Vercel/Render)
- `onaddstream` is deprecated in newer browsers — future update will migrate to `ontrack`
- Screen sharing audio may not work on all browsers

---

## 🔮 Future Improvements

- [ ] Virtual backgrounds
- [ ] Recording functionality  
- [ ] Noise cancellation
- [ ] Mobile app (React Native)
- [ ] Waiting room / host controls
- [ ] End-to-end encryption

---

## 👨‍💻 Author

**Vishal**  
GitHub: [@Vishal777956](https://github.com/Vishal777956)

---

> Built with ❤️ using React, Node.js, WebRTC & Socket.io
