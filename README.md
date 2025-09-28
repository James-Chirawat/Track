# Track Project

A full-stack application with React frontend and Cloudflare Workers backend.

## Project Structure

```
Track/
├── frontend/          # React + Tailwind CSS frontend
│   ├── src/
│   │   ├── App.jsx    # Main React component
│   │   ├── main.jsx   # React entry point
│   │   └── index.css  # Tailwind CSS styles
│   ├── package.json
│   └── vite.config.js
├── backend/           # Cloudflare Workers backend
│   ├── src/
│   │   └── index.js   # Worker entry point
│   ├── package.json
│   └── wrangler.toml  # Cloudflare configuration
└── README.md
```

## Frontend (React + Tailwind CSS)

### Features
- ⚛️ React 18 with JSX
- 🎨 Tailwind CSS for styling
- ⚡ Vite for fast development
- 🔧 ESLint for code quality
- 📱 Responsive design

### Getting Started

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Backend (Cloudflare Workers)

### Features
- 🚀 Cloudflare Workers with Node.js compatibility
- 🌐 CORS enabled
- 📡 RESTful API endpoints
- 🔄 Hot reload in development
- ☁️ Edge deployment ready

### Getting Started

```bash
cd backend
npm install
npm run dev
```

The backend will be available at `http://localhost:8787`

### Available Scripts
- `npm run dev` - Start development server
- `npm run deploy` - Deploy to Cloudflare
- `npm run cf-typegen` - Generate TypeScript types

### API Endpoints

- `GET /` - Welcome page with documentation
- `GET /api/hello` - Hello world endpoint with request info
- `GET /api/status` - Health check endpoint

## Development Workflow

1. **Start Frontend Development:**
   ```bash
   cd frontend && npm install && npm run dev
   ```

2. **Start Backend Development:**
   ```bash
   cd backend && npm install && npm run dev
   ```

3. **Deploy Backend:**
   ```bash
   cd backend && npm run deploy
   ```

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Cloudflare account (for deployment)

## Next Steps

- Connect frontend to backend API
- Add authentication
- Implement database integration
- Set up CI/CD pipeline
- Add testing suites

Happy coding! 🎉


