# NOISE - Collaborative Audio Board

A web application where users can record audio "noises" and add text captions to a shared collaborative board. All items are persisted to a database and visible to all users in real-time.

![NOISE App](./frontend/public/noise-logo.svg)

## Features

- 🎙️ **Record Audio**: Record audio directly in the browser
- 📝 **Add Captions**: Create text captions with custom fonts and styling
- 🎨 **Visualizations**: Choose between waveform, bars, and spectrum visualizations
- 🖱️ **Drag & Drop**: Freely position items on the board
- 🔄 **Real-time Updates**: See other users' creations instantly via WebSocket
- 🔐 **Anonymous Ownership**: Edit and delete only your own items
- 📱 **Responsive**: Works on desktop and mobile

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- Socket.IO Client

### Backend
- Node.js + TypeScript
- Express.js
- PostgreSQL + Prisma ORM
- Socket.IO
- JWT Authentication
- Zod Validation

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm

### Development Mode

The easiest way to start is using the provided script:

```bash
# Clone the repository
cd noise-full

# Make the script executable (if needed)
chmod +x start-dev.sh

# Start everything
./start-dev.sh
```

This will:
1. Start PostgreSQL via Docker
2. Install dependencies for both frontend and backend
3. Run database migrations
4. Start both servers

Or do it manually:

```bash
# 1. Start PostgreSQL
docker-compose up -d postgres

# 2. Start Backend
cd backend
npm install
npx prisma migrate dev --name init
npm run dev

# 3. Start Frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs

## Production Deployment

### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

The production setup includes:
- PostgreSQL database
- Backend API server
- Frontend served via Nginx

Access at: http://localhost:8080

### Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Key variables:
- `JWT_SECRET`: Secret for JWT token signing (CHANGE IN PRODUCTION!)
- `CORS_ORIGINS`: Allowed origins for CORS
- `VITE_API_URL`: Backend URL for the frontend build

## Project Structure

```
noise-full/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── api.js           # API client
│   │   ├── useWebSocket.js  # Real-time updates hook
│   │   ├── App.jsx          # Main application
│   │   └── components/      # React components
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                  # Node.js backend
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth, validation, uploads
│   │   ├── services/        # Storage, WebSocket
│   │   └── types/           # TypeScript types
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── Dockerfile
│
├── docker-compose.yml       # Full stack deployment
├── start-dev.sh            # Development startup script
└── README.md
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/session` | No | Create anonymous session |
| GET | `/api/board` | No | Get all board items |
| POST | `/api/audio-items` | Yes | Upload audio (multipart) |
| PATCH | `/api/audio-items/:id` | Yes | Update audio item |
| POST | `/api/audio-items/:id/rerecord` | Yes | Replace audio file |
| DELETE | `/api/audio-items/:id` | Yes | Delete audio item |
| POST | `/api/text-items` | Yes | Create text item |
| PATCH | `/api/text-items/:id` | Yes | Update text item |
| DELETE | `/api/text-items/:id` | Yes | Delete text item |

## How It Works

### Authentication Flow

1. On first visit, the frontend calls `POST /api/session`
2. Backend generates a JWT token and owner ID
3. Token is stored in localStorage
4. All write operations include `Authorization: Bearer <token>` header
5. Backend verifies ownership before allowing edits/deletes

### Real-time Updates

1. Frontend connects to WebSocket server on page load
2. When any user creates/updates/deletes an item, the backend broadcasts the event
3. All connected clients receive the update and refresh their UI
4. No polling required - instant updates!

### Data Models

**AudioItem**
```json
{
  "id": "uuid",
  "ownerId": "uuid",
  "audioUrl": "/uploads/file.webm",
  "visualFormat": "waveform",
  "x": 100,
  "y": 200,
  "scale": 100
}
```

**TextItem**
```json
{
  "id": "uuid",
  "ownerId": "uuid",
  "text": "Your caption",
  "font": "rubik-glitch",
  "opacity": 100,
  "x": 100,
  "y": 200,
  "scale": 100
}
```

## Development Notes

### Backend Scripts

```bash
cd backend
npm run dev          # Start with hot reload
npm run build        # Build TypeScript
npm run migrate      # Run database migrations
npm run db:studio    # Open Prisma Studio GUI
```

### Frontend Scripts

```bash
cd frontend
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
```

### Database Management

```bash
# View database with Prisma Studio
cd backend
npx prisma studio

# Reset database
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name your_migration_name
```

## Troubleshooting

### Backend won't start

1. Make sure PostgreSQL is running: `docker-compose up -d postgres`
2. Check the database connection in `.env`
3. Run migrations: `cd backend && npx prisma migrate deploy`

### Frontend can't connect to backend

1. Check CORS configuration in backend `.env`
2. Make sure `VITE_API_URL` points to the correct backend URL
3. Verify backend is running on the expected port

### WebSocket not connecting

1. Check that Socket.IO is configured with correct origins
2. Try both `websocket` and `polling` transports
3. Check browser console for connection errors

### Audio recording fails

1. Make sure you're using HTTPS (or localhost)
2. Grant microphone permissions when prompted
3. Check browser compatibility for MediaRecorder API

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
