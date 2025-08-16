# Flour Delivery Ecommerce App

A comprehensive flour delivery platform built with Angular, Node.js/Express, and Firebase, featuring real-time order tracking, subscription management, and admin dashboard.

## Features

### User Module
- Mobile OTP-based authentication
- Product browsing with multiple weight options
- Shopping cart and checkout
- Subscription management (weekly/biweekly with 5% discount)
- Address management with auto-suggestions
- Pay on delivery
- Discount coupon support

### Flour Mill Module
- Order management dashboard
- Grinding and packaging workflow
- Order status updates

### Admin Module
- Product management
- Discount code management
- Sales analytics and heatmaps
- Flour mill owner management
- Real-time delivery tracking

## Tech Stack

- **Frontend**: Angular 17 (PWA)
- **Backend**: Node.js + Express
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Real-time**: Firebase Realtime Database
- **Deployment**: Docker + PM2

## Project Structure

```
flour-delivery-app/
├── frontend/                 # Angular PWA application
├── backend/                  # Node.js/Express API
├── shared/                   # Shared types and utilities
├── docker/                   # Docker configuration
├── scripts/                  # Deployment scripts
└── docs/                     # Documentation
```

## Quick Start

### Prerequisites
- Node.js 18+
- Angular CLI 17+
- Firebase CLI
- Docker (optional)

### Setup Instructions

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd flour-delivery-app
   npm run setup
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Configure Firebase and other environment variables
   ```

3. **Start Development Servers**
   ```bash
   npm run dev          # Starts both frontend and backend
   npm run dev:frontend # Frontend only
   npm run dev:backend  # Backend only
   ```

4. **Build and Deploy**
   ```bash
   npm run build        # Production build
   npm run deploy       # Deploy to production
   ```

## Architecture

- **Modular Design**: Feature-based modules for scalability
- **PWA**: Progressive Web App with offline support
- **Real-time Updates**: Firebase integration for live order tracking
- **Responsive Design**: Mobile-first approach with Swiggy-like UX
- **Performance**: Lazy loading, caching, and optimization

## API Documentation

- **Base URL**: `http://localhost:3000/api`
- **Authentication**: JWT tokens via Firebase
- **Real-time**: WebSocket connections for live updates

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License