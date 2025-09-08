# mini-HIS: 醫院資訊系統示範專案

## Project Overview
A TypeScript-based Hospital Information System demonstration project that showcases "type-first" development methodology and Algebraic Data Types (ADT) to simplify and standardize code logic.

## Project Structure
```
mini-HIS/
├── src/
│   ├── types/        # Type definitions
│   ├── models/       # Model definitions (Patient, Appointment, Prescription, MedicalService)
│   └── index.ts      # Main entry point - full hospital workflow demo
```

## Current Status
✅ **WORKING** - Project successfully imported and configured for Replit environment

## Setup Details
- **Language**: TypeScript with Node.js 20.19.3
- **Dependencies**: typescript, ts-node (zero runtime dependencies)
- **Module System**: CommonJS (for compatibility)
- **Workflow**: Runs main demo showing complete hospital workflow

## Available Scripts
- `npm run start` - Start Express web server (port 5000)
- `npm run dev` - Development mode (same as start)
- `npm run demo` - Run console demo of hospital workflow

## Key Features
- Type-safe state machines using TypeScript union types
- ADT (Algebraic Data Type) implementation with Result<T> pattern
- Zero external dependencies (pure TypeScript/Node.js)
- Complete hospital workflow: Registration → Admission → Prescription → Medical Services → Discharge

## Architecture Highlights
- **Type-First Development**: All business logic is guided by TypeScript types
- **State Management**: Each entity (Patient, Appointment, etc.) has clearly defined states with type-safe transitions
- **Error Handling**: Unified Result<T> type for success/failure handling
- **Modularity**: Separate modules for each domain (Patient, Appointment, Prescription, MedicalService)

## Recent Changes (Setup)
- Configured TypeScript with CommonJS modules for Node.js compatibility
- Added package.json with proper scripts for running demos and examples
- Set up workflow to run the main demonstration
- Verified all examples work correctly

## User Preferences
- Keep the zero-dependency approach (TypeScript + Node.js only)
- Maintain type-first development methodology
- Preserve educational structure with examples and learning materials