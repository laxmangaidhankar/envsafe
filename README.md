# 🛡️ EnvSafe (CipherDrop)

> **Zero-Knowledge End-to-End Encrypted (E2EE) Temporary Room & Secret Sharing Platform**

EnvSafe is a secure, ephemeral file and secret sharing web application built to eliminate plain-text credential leaks across persistent communication channels (Slack, Discord, Email, WhatsApp). By utilizing client-side **AES-256-GCM encryption** via the Web Crypto API, secret decryption keys remain isolated within the browser hash fragment (`#KEY`) and are never sent to the server.

---

## 🌟 Key Features

- 🔐 **Zero-Knowledge End-to-End Encryption (E2EE)**
  - All text snippets, `.env` files, code, and binary uploads are encrypted client-side in the browser using 256-bit AES-GCM before transmission.
  - The server only stores raw ciphertext blobs and random IVs.
- 🔑 **URL Hash Fragment Key Delivery**
  - Encryption keys are passed through the URL fragment (`https://domain.com/join/ROOM_ID#SECRET_KEY`).
  - RFC 3986 specifies that browser hash fragments are never included in HTTP request headers, guaranteeing the server operators cannot decrypt your secrets.
- ⏳ **Self-Destructing Rooms & Automatic Purging**
  - Rooms automatically expire after a configurable duration (5 min, 10 min, 30 min, 60 min).
  - MongoDB TTL (Time-To-Live) indexes combined with a backend cleanup service ensure all ciphertext and metadata are permanently erased upon expiry.
- 💥 **Instant Manual Room Destruction**
  - Room creators receive a cryptographically secure `destroyToken` (hashed with SHA-256 on the server) enabling instant room teardown and file purging.
- ⚡ **Real-Time Live Synchronization**
  - Powered by Socket.io for instant updates: live participant counters, real-time file upload feed, and instant expiration/destruction notifications across all connected peers.
- 🛡️ **Anti-Abuse & Rate Limiting**
  - Integrated IP-based rate limiting on room creation, joining, and file uploads to prevent brute-force attacks and storage exhaustion.

---

## 🏗️ Security Architecture & Threat Model

### Cryptographic Workflow

```
[ Sender Browser ]                               [ Backend Server ]                            [ Receiver Browser ]
       |                                                 |                                              |
 1. Generate AES-256-GCM Key                             |                                              |
 2. Encrypt payload with random 96-bit IV                |                                              |
 3. Send Ciphertext + IV ------------------------------> | Store Ciphertext & IV in Mongo               |
 4. Share Room Link + #KEY ---------------------------------------------------------------------------> 5. Extract #KEY from URL
                                                         | <----------------- Fetch Ciphertext + IV ---- 6. Request Ciphertext
                                                         | ------------------ Return Ciphertext + IV --> 7. Decrypt locally via Web Crypto API
```

### Threat Model & Guarantees

| Vulnerability / Threat | Protection Level | Technical Mechanism |
| :--- | :--- | :--- |
| **Server-Side Data Breach** | 🛡️ Protected | Backend only stores ciphertext blobs. Compromised DB contains zero plaintext secrets. |
| **Server Operator Inspection** | 🛡️ Protected | Encryption happens in browser before HTTP dispatch. URL `#key` is ignored by HTTP requests. |
| **Persistent Chat Archives** | 🛡️ Protected | Shared room URLs expire and self-destruct, preventing permanent leaks in chat histories. |
| **Malicious Recipient** | ⚠️ Not Protected | If a recipient copies decrypted content locally, cryptographic controls end at the endpoint. |
| **Client Device Malware** | ⚠️ Not Protected | Compromised client runtime (keyloggers, malicious browser extensions) bypasses E2EE. |

---

## 🛠️ Tech Stack

### **Frontend (`client/`)**
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS & Lucide Icons
- **Cryptography:** Web Crypto API (`window.crypto.subtle`) — native, hardware-accelerated AES-256-GCM key generation, encryption & decryption
- **Real-Time:** `socket.io-client`
- **Routing & HTTP:** `react-router-dom` v6, `axios`

### **Backend (`server/`)**
- **Runtime:** Node.js with Express 5
- **Database:** MongoDB with Mongoose ODM (TTL Indexes)
- **Real-Time WebSockets:** `socket.io`
- **Security & Logging:** `express-rate-limit`, `cookie-parser`, `pino` logger
- **Dev Tools:** `nodemon`

---

## 📁 Project Structure

```text
envsafe/
├── client/                     # React Frontend Application
│   ├── src/
│   │   ├── components/         # UI Components (ExpiryTimer, FileCard, SecurityNotice, ThreatModelModal, Navbar)
│   │   ├── crypto/             # Client-Side Cryptographic Utilities
│   │   │   ├── encryption.js   # AES-256-GCM Encryption
│   │   │   ├── decryption.js   # AES-256-GCM Decryption
│   │   │   └── keyManager.js   # Key Generation, Base64URL Conversion & Import/Export
│   │   ├── pages/              # App Pages (Home, CreateRoom, JoinRoom, Room)
│   │   ├── services/           # Axios API Client & Socket.io Event Handlers
│   │   ├── App.jsx             # Main Application Routes & Layout
│   │   └── main.jsx            # React Root Entry Point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── server/                     # Express & Socket.io Backend API
    ├── src/
    │   ├── config/             # Environment & Database Configuration
    │   ├── controllers/        # Request Handlers (roomController, fileController)
    │   ├── middleware/         # Authorization, Rate-Limiting & Room Validation
    │   ├── models/             # Mongoose Schemas (Room, SharedFile with TTL Indexes)
    │   ├── routes/             # REST API Endpoints (/api/v1/rooms, /api/v1/rooms/files)
    │   ├── services/           # Cleanup Cron Service & Socket.io Room Manager
    │   └── utils/              # Pino Logger Utility
    ├── package.json
    └── server.js               # HTTP & WebSocket Server Entry Point
```

---

## ⚙️ Environment Variables

### **Backend (`server/.env`)**

Create a `.env` file inside the `server/` directory:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/envsafe
CLIENT_URL=http://localhost:5173
NODE_ENV=development
LOG_LEVEL=info
```

### **Frontend (`client/.env`)**

Create a `.env` file inside the `client/` directory (optional for custom deployment):

```env
VITE_API_BASE_URL=http://localhost:3000
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18.x or higher
- **npm** v9.x or higher
- **MongoDB** running locally or a MongoDB Atlas URI

---

### Step 1: Setup Backend Server

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment configuration
# Copy or create server/.env with your MONGO_URI and PORT

# Start development server with hot-reload
npm run dev
```

The backend server will launch on `http://localhost:3000`.

---

### Step 2: Setup Frontend Client

```bash
# Navigate to client directory (in a new terminal)
cd client

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

The client application will launch on `http://localhost:5173`.

---

## 📡 API Reference

### REST Endpoints (`/api/v1`)

| Method | Endpoint | Description | Rate Limited |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/rooms` | Create a new room with expiry duration and participant limits | Yes |
| `GET` | `/api/v1/rooms/:roomId` | Fetch room status and metadata | Yes |
| `DELETE` | `/api/v1/rooms/:roomId` | Manually self-destruct a room and purge files | No |
| `POST` | `/api/v1/rooms/files/:roomId` | Upload encrypted ciphertext blob to a room | Yes |
| `GET` | `/api/v1/rooms/files/:roomId` | Fetch all encrypted file payloads for a room | No |
| `DELETE` | `/api/v1/rooms/files/:roomId/:fileId` | Delete a specific encrypted file from a room | No |

---

### Real-Time WebSockets (`Socket.io`)

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join-room` | Client ➔ Server | `{ roomId }` | Connect socket to room channel |
| `leave-room` | Client ➔ Server | `{ roomId }` | Disconnect socket from room channel |
| `room:joined` | Server ➔ Client | `{ participantCount }` | Broadcast updated participant count |
| `participant:left` | Server ➔ Client | `{ participantCount }` | Broadcast when a participant leaves |
| `file:added` | Server ➔ Client | `{ file }` | Real-time push of newly uploaded ciphertext |
| `file:deleted` | Server ➔ Client | `{ fileId }` | Real-time push when a file is deleted |
| `room:expired` | Server ➔ Client | `{ roomId, message }` | Broadcast when room reaches TTL expiration |
| `room:destroyed` | Server ➔ Client | `{ roomId, message }` | Broadcast when creator destroys room |

---

## 🔒 Security Best Practices for Users

1. **Share Links Carefully:** Ensure the full URL (including `#KEY`) is shared over trusted channels.
2. **Verify Expiry Timers:** Set room expiry to the minimum duration necessary for the handover.
3. **Manual Teardown:** Click **"Destroy Room Now"** as soon as the intended recipient confirms receiving the credentials.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
