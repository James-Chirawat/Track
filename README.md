# Cocoa Track - Production Tracking System

A comprehensive cocoa production tracking system that follows the journey from farm to finished product through upstream, midstream, and downstream processes.

## 🌱 Overview

Cocoa Track enables complete traceability of cocoa production with:
- **Upstream**: Farm planting, growing, and harvesting
- **Midstream**: Fermentation, drying, and roasting processes  
- **Downstream**: Grinding, packaging, and distribution
- **QR Code Generation**: For product traceability
- **QR Code Scanning**: To view complete production history

## 🏗️ Project Structure

```
Track/
├── frontend/                    # React + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx      # Main layout component
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   # Main dashboard
│   │   │   ├── ProductionRoadmap.jsx  # Production tracking
│   │   │   ├── QRScanner.jsx   # QR code scanner
│   │   │   └── ProductDetails.jsx     # Product history view
│   │   ├── lib/
│   │   │   └── supabase.js     # Supabase client
│   │   ├── App.jsx             # Main app with routing
│   │   └── main.jsx            # React entry point
│   ├── package.json
│   └── .env.example            # Environment variables template
├── backend/                     # Cloudflare Workers backend
│   ├── src/
│   │   └── index.js            # Worker entry point
│   ├── package.json
│   └── wrangler.toml           # Cloudflare configuration
├── database-schema.sql          # Supabase database schema
└── README.md
```

## 🚀 Quick Start

### 1. Database Setup (Supabase)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL commands from `database-schema.sql` in your Supabase SQL editor
3. Copy your project URL and anon key

### 2. Frontend Setup

```bash
cd frontend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 3. Backend Setup

The backend is deployed at: `https://track-backend.webhookapi.workers.dev`

For local development:
```bash
cd backend
npm install
npm run dev
```

The local backend will be available at `http://localhost:8787`

## 🌟 Features

### Production Tracking
- **Upstream Stages**:
  - 🌱 Planting (farm location, seed variety, farmer details)
  - 🍃 Growing & Care (fertilizer, pest control, irrigation)
  - ✂️ Harvesting (quantity, quality grade, harvest notes)

- **Midstream Stages**:
  - 🧪 Fermentation (duration, temperature, humidity)
  - ☀️ Drying (method, duration, moisture content)
  - 🔥 Roasting (temperature, duration, roast level)

- **Downstream Stages**:
  - ⚙️ Grinding & Processing (grind size, processing method)
  - 📦 Packaging (package type, batch number, expiry)
  - 🚚 Distribution (distributor, destination, tracking)

### QR Code System
- **Generation**: Automatic QR code creation for each batch
- **Printing**: Print-ready QR codes for product labeling
- **Scanning**: Camera-based QR code scanning
- **Traceability**: Complete production history from QR scan

### Dashboard & Analytics
- Production statistics and metrics
- Recent activity tracking
- Production flow visualization
- Batch status monitoring

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Supabase JS** - Database client
- **QR Code Libraries** - Generation and scanning
- **Remix Icons** - Beautiful icon set

### Backend
- **Cloudflare Workers** - Edge computing platform deployed at `https://track-backend.webhookapi.workers.dev`
- **Node.js Compatibility** - Modern JavaScript runtime
- **Supabase Integration** - PostgreSQL database with real-time features
- **RESTful API** - Complete API endpoints for all operations

### Database
- **PostgreSQL** (via Supabase)
- **Row Level Security** - Built-in security policies
- **Real-time subscriptions** - Live data updates
- **JSON storage** - Flexible stage data storage

## 📱 Usage Guide

### Starting a New Production Batch

1. Navigate to **Production Roadmap**
2. Click **"Start New Batch"**
3. Record data for each production stage:
   - Click on any stage card to open the data entry form
   - Fill in required and optional fields
   - Save the stage data

### Tracking Production Progress

1. View the **Dashboard** for overview statistics
2. Monitor batch progress through the production roadmap
3. Each completed stage is marked and timestamped

### QR Code Generation & Printing

1. Complete the final distribution stage
2. QR code is automatically generated
3. Click **"Show QR"** to display the code
4. Click **"Print QR Code"** for physical labeling

### Scanning QR Codes

1. Navigate to **QR Scanner**
2. Allow camera permissions
3. Point camera at QR code on product
4. View complete production history

### Viewing Production History

1. Scan QR code or enter product ID manually
2. View detailed timeline of all production stages
3. See data recorded at each step
4. Print or share the production history

## 🔧 Configuration

### Environment Variables

Create `.env` file in the frontend directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend API

The system uses a hybrid approach:
- **Primary**: Cloudflare Workers API at `https://track-backend.webhookapi.workers.dev`
- **Fallback**: Direct Supabase calls for reliability

API Endpoints:
- `GET /api/branches` - Get all branches
- `POST /api/branches` - Create new branch
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get product details
- `POST /api/production-stages` - Create production stage
- `GET /api/dashboard` - Get dashboard statistics

### Database Schema

The system uses two main tables:

- **products**: Main product/batch information
- **production_stages**: Individual stage records with JSON data

## 🚀 Deployment

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy the dist/ folder to your hosting platform
```

### Backend Deployment
```bash
cd backend
npm run deploy
```

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Public read access for QR code scanning
- Secure data insertion and updates
- Environment variable protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Check the database schema in `database-schema.sql`
- Review the component documentation
- Test with the sample data provided

---

**Happy Tracking! 🍫🌱**


