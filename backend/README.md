# NOISE Backend

Backend API for NOISE - a shared audio/visual board application where users can record audio "noises" and add text captions to a collaborative board.

## Features

- 🎙️ **Audio Recording**: Upload and manage audio recordings with visualizations
- 📝 **Text Captions**: Add text with custom fonts and styling
- 🔐 **Anonymous Authentication**: JWT-based ownership without registration
- 🔄 **Real-time Updates**: WebSocket support for live board synchronization
- 📚 **API Documentation**: Interactive Swagger/OpenAPI docs
- 🐳 **Docker Ready**: Easy deployment with Docker Compose

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod
- **Real-time**: Socket.IO
- **Documentation**: Swagger/OpenAPI

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (for PostgreSQL)
- npm or yarn

### 1. Clone and Install

```bash
cd noise-backend
npm install
```

### 2. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env

# The defaults work for local development
```

### 3. Start PostgreSQL

```bash
docker-compose up -d postgres
```

### 4. Run Database Migrations

```bash
npm run migrate
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3001`

- **API Base URL**: `http://localhost:3001/api`
- **API Documentation**: `http://localhost:3001/api/docs`
- **WebSocket**: `ws://localhost:3001`

## Frontend Integration Guide

### 1. Create a Session

On first load (or if no token exists), create a session to get an authentication token:

```javascript
// Frontend - on app initialization
async function initSession() {
  let token = localStorage.getItem('noise_token');
  let ownerId = localStorage.getItem('noise_ownerId');
  
  if (!token) {
    const response = await fetch('http://localhost:3001/api/session', {
      method: 'POST',
    });
    const data = await response.json();
    
    token = data.token;
    ownerId = data.ownerId;
    
    localStorage.setItem('noise_token', token);
    localStorage.setItem('noise_ownerId', ownerId);
  }
  
  return { token, ownerId };
}
```

### 2. Load the Board

Fetch all items when the app loads:

```javascript
async function loadBoard() {
  const response = await fetch('http://localhost:3001/api/board');
  const data = await response.json();
  
  // data.audioItems - array of audio items
  // data.textItems - array of text items
  
  return data;
}
```

### 3. Upload Audio (Multipart Form Data)

When recording is complete:

```javascript
async function uploadAudio(audioBlob, x, y, visualFormat = 'waveform', scale = 100) {
  const token = localStorage.getItem('noise_token');
  
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('x', x.toString());
  formData.append('y', y.toString());
  formData.append('visualFormat', visualFormat);
  formData.append('scale', scale.toString());
  
  const response = await fetch('http://localhost:3001/api/audio-items', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  return response.json();
}
```

### 4. Create Text Item

```javascript
async function createTextItem(text, x, y, font = 'rubik-glitch', opacity = 100, scale = 100) {
  const token = localStorage.getItem('noise_token');
  
  const response = await fetch('http://localhost:3001/api/text-items', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, x, y, font, opacity, scale }),
  });
  
  return response.json();
}
```

### 5. Update Item Position/Properties

```javascript
async function updateAudioItem(id, updates) {
  const token = localStorage.getItem('noise_token');
  
  const response = await fetch(`http://localhost:3001/api/audio-items/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates), // { x, y, scale, visualFormat }
  });
  
  return response.json();
}

async function updateTextItem(id, updates) {
  const token = localStorage.getItem('noise_token');
  
  const response = await fetch(`http://localhost:3001/api/text-items/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates), // { text, x, y, scale, font, opacity }
  });
  
  return response.json();
}
```

### 6. Delete Item (Owner Only)

```javascript
async function deleteAudioItem(id) {
  const token = localStorage.getItem('noise_token');
  
  await fetch(`http://localhost:3001/api/audio-items/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}
```

### 7. Re-record Audio (Owner Only)

```javascript
async function rerecordAudio(id, newAudioBlob) {
  const token = localStorage.getItem('noise_token');
  
  const formData = new FormData();
  formData.append('file', newAudioBlob, 'recording.webm');
  
  const response = await fetch(`http://localhost:3001/api/audio-items/${id}/rerecord`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  return response.json();
}
```

### 8. WebSocket for Real-time Updates

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

// Listen for item events
socket.on('audioItemCreated', (event) => {
  const newItem = event.data;
  // Add to your items state
});

socket.on('audioItemUpdated', (event) => {
  const updatedItem = event.data;
  // Update in your items state
});

socket.on('audioItemDeleted', (event) => {
  const { id } = event.data;
  // Remove from your items state
});

socket.on('textItemCreated', (event) => {
  const newItem = event.data;
  // Add to your items state
});

socket.on('textItemUpdated', (event) => {
  const updatedItem = event.data;
  // Update in your items state
});

socket.on('textItemDeleted', (event) => {
  const { id } = event.data;
  // Remove from your items state
});
```

### 9. Checking Ownership

Compare the item's `ownerId` with your stored `ownerId` to determine if the current user can edit/delete:

```javascript
const myOwnerId = localStorage.getItem('noise_ownerId');

function canEditItem(item) {
  return item.ownerId === myOwnerId;
}
```

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/session` | No | Create anonymous session |
| GET | `/api/board` | No | Get all board items |
| POST | `/api/audio-items` | Yes | Create audio item (multipart) |
| PATCH | `/api/audio-items/:id` | Yes | Update audio item |
| POST | `/api/audio-items/:id/rerecord` | Yes | Replace audio file |
| DELETE | `/api/audio-items/:id` | Yes | Delete audio item |
| POST | `/api/text-items` | Yes | Create text item |
| PATCH | `/api/text-items/:id` | Yes | Update text item |
| DELETE | `/api/text-items/:id` | Yes | Delete text item |

## Example curl Requests

### Create Session
```bash
curl -X POST http://localhost:3001/api/session
```

### Get Board
```bash
curl http://localhost:3001/api/board
```

### Create Audio Item
```bash
curl -X POST http://localhost:3001/api/audio-items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@recording.webm" \
  -F "x=100" \
  -F "y=200" \
  -F "visualFormat=waveform" \
  -F "scale=100"
```

### Create Text Item
```bash
curl -X POST http://localhost:3001/api/text-items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello World","x":100,"y":200,"font":"rubik-glitch","opacity":100,"scale":100}'
```

### Update Audio Item
```bash
curl -X PATCH http://localhost:3001/api/audio-items/ITEM_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"x":150,"y":250,"scale":120}'
```

### Delete Item
```bash
curl -X DELETE http://localhost:3001/api/audio-items/ITEM_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Data Models

### AudioItem Response
```json
{
  "id": "uuid",
  "ownerId": "uuid",
  "audioUrl": "/uploads/filename.webm",
  "durationMs": null,
  "visualFormat": "waveform",
  "x": 100,
  "y": 200,
  "scale": 100,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### TextItem Response
```json
{
  "id": "uuid",
  "ownerId": "uuid",
  "text": "Your caption",
  "font": "rubik-glitch",
  "opacity": 100,
  "x": 100,
  "y": 200,
  "scale": 100,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Run production server |
| `npm run migrate` | Run database migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:studio` | Open Prisma Studio GUI |

## Project Structure

```
noise-backend/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── config.ts          # Environment configuration
│   ├── index.ts           # Application entry point
│   ├── swagger.ts         # OpenAPI documentation
│   ├── middleware/
│   │   ├── auth.ts        # JWT authentication
│   │   ├── errorHandler.ts # Error handling
│   │   ├── upload.ts      # File upload (Multer)
│   │   └── validation.ts  # Zod validation
│   ├── routes/
│   │   ├── session.ts     # Session management
│   │   ├── board.ts       # Board loading
│   │   ├── audioItems.ts  # Audio CRUD
│   │   └── textItems.ts   # Text CRUD
│   ├── services/
│   │   ├── storage.ts     # File storage abstraction
│   │   └── websocket.ts   # Real-time events
│   ├── types/
│   │   ├── index.ts       # Type definitions
│   │   └── schemas.ts     # Zod schemas
│   └── utils/
│       ├── jwt.ts         # JWT utilities
│       └── prisma.ts      # Prisma client
├── uploads/               # Audio file storage
├── examples/
│   ├── curl-examples.sh   # curl command examples
│   └── frontend-integration.js  # Frontend code examples
├── docker-compose.yml     # Docker services
├── Dockerfile             # Production container
├── .env.example           # Environment template
└── package.json
```

## Security Features

- **CORS**: Configured for frontend domain
- **Helmet**: Security headers
- **Rate Limiting**: General + stricter upload limits
- **Input Validation**: Zod schemas for all inputs
- **File Validation**: MIME type and size checks
- **JWT Authentication**: Secure token-based ownership

## License

MIT
