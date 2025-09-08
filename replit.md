# mini-HIS: 醫院資訊系統示範專案

## Project Overview
A TypeScript-based Hospital Information System demonstration project that showcases "type-first" development methodology and Algebraic Data Types (ADT) to simplify and standardize code logic. Now includes a complete web interface with database abstraction layer.

## Project Structure
```
mini-HIS/
├── README.md         # Project documentation
├── src/
│   ├── public/       # Frontend static files (HTML + TailwindCSS + JS)
│   ├── database/     # Database abstraction layer (CQRS pattern)
│   │   ├── interface.ts     # Database interface definition
│   │   ├── json-database.ts # JSON database implementation
│   │   └── index.ts         # Database instance export
│   ├── types/        # Type definitions
│   ├── models/       # Model definitions (Patient, Appointment, Prescription, MedicalService)
│   ├── db.json       # JSON database file
│   ├── server.ts     # Express backend server
│   └── index.ts      # Console demo program
```

## Current Status
✅ **WORKING** - Complete web application with database abstraction layer

## Setup Details
- **Language**: TypeScript with Node.js 22.17.0 (native TypeScript support)
- **Frontend**: HTML + TailwindCSS CDN + Vanilla JavaScript
- **Backend**: Express.js + TypeScript
- **Database**: JSON file database with CQRS abstraction layer
- **Architecture**: Can seamlessly switch database implementations

## Available Scripts
- `npm run start` - Start Express web server (port 5000)
- `npm run dev` - Development mode (same as start)
- `npm run demo` - Run console demo of hospital workflow

## Key Features
- **Web Interface**: Complete hospital management system with responsive UI
- **Database Abstraction**: CQRS pattern allows seamless database switching
- **Type-safe state machines**: Using TypeScript union types
- **ADT implementation**: Result<T> pattern for error handling
- **RESTful API**: Complete API endpoints for all hospital operations
- **Complete hospital workflow**: Registration → Admission → Prescription → Medical Services → Discharge

## Architecture Highlights
- **Type-First Development**: All business logic is guided by TypeScript types
- **Database Abstraction Layer**: CQRS pattern for easy database switching (currently JSON, can switch to PostgreSQL/MongoDB)
- **State Management**: Each entity has clearly defined states with type-safe transitions
- **Error Handling**: Unified Result<T> type for success/failure handling
- **Modularity**: Separate modules for each domain with clear interfaces

## Recent Changes (Major Update)
- **UI Improvements**: Gender selection as radio buttons, patient selection as dropdowns, main navigation as buttons  
- **Modal Popups**: Added detailed information modals for all four main sections (Patient, Appointment, Prescription, Medical Service)
- **Enhanced UX**: Automatic patient loading for dropdowns, clickable list items with hover effects
- **JSON Database Migration**: Switched from CSV to JSON database for better reliability and error handling
- **Database Abstraction**: Implemented CQRS pattern for database operations
- **Backend API**: Express server with RESTful endpoints
- **Project Restructure**: Moved public to src/public, added database layer

## User Preferences
- Focus on JSON database implementation (no multi-database code complexity)
- Maintain CQRS API design for seamless future database changes
- Preserve type-first development methodology
- Keep database abstraction layer clean and focused