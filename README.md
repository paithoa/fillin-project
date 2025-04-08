# SportsConnect

A React Native application to help players find teams and teams find players.

## Features

- Homepage with posts from players and teams
- Create posts to find players or join teams
- Chat system (premium feature)
- User profiles with membership upgrades

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **State Management**: Context API

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB

### Installation

1. Clone the repository
```
git clone <repository-url>
cd SportsConnect
```

2. Install dependencies for all parts of the application
```
npm run install-all
```

Alternatively, you can install dependencies manually:
```
# Root dependencies
npm install

# Client dependencies
cd client
npm install

# Server dependencies
cd ../server
npm install
cd ..
```

3. Set up environment variables
The `.env` file in the server directory has been configured with default development settings. For production, please update the values accordingly.

4. Run the application
```
# Run backend and frontend concurrently
npm run dev

# Run backend only
npm run server

# Run frontend only
npm run client
```

## Deployment

### Backend Deployment
The backend is configured for deployment on platforms like Heroku:
```
heroku create
git push heroku main
```

### Frontend Deployment
The frontend can be deployed using Expo:
```
cd client
expo publish
```

## Project Structure

- `/client` - React Native frontend application with Expo
  - `/components` - Reusable UI components
  - `/screens` - Application screens
  - `/navigation` - Navigation configuration
  - `/context` - Context API for state management
  - `/services` - API services
  
- `/server` - Node.js backend application
  - `/controllers` - API controllers
  - `/models` - MongoDB models
  - `/routes` - API routes
  - `/config` - Configuration files
  - `/middleware` - Custom middleware

## Troubleshooting

If you encounter any issues with the setup:

1. Ensure MongoDB is running locally
2. Check that all dependencies are installed
3. Verify the `.env` file is correctly configured
4. Make sure ports 5001 (backend) and 19000 (frontend) are available 