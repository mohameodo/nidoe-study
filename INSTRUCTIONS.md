# Nidoe Smart Study Helper - Setup Instructions

This document provides step-by-step instructions for getting the Nidoe Smart Study Helper application up and running on your local machine.

## Prerequisites

- Node.js (v18 or later) installed
- npm or yarn installed
- Git installed
- A Firebase account (for authentication and database features)
- An OpenAI API key (optional, for AI-powered quiz generation)

## Setup Steps

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/nidoe-study.git
cd nidoe-study
```

2. **Install dependencies**

```bash
# Using npm
npm install

# Using yarn
yarn install
```

Alternatively, you can use the provided setup script:

```bash
# Make the script executable (Unix/Linux/macOS)
chmod +x setup.sh

# Run the script
./setup.sh
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory with the following variables:

```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# OpenAI
OPENAI_API_KEY=your-openai-api-key
```

4. **Create a Firebase project**

- Go to the [Firebase Console](https://console.firebase.google.com/)
- Create a new project
- Set up Authentication (enable Email/Password sign-in)
- Create a Firestore database
- Go to Project Settings and copy the Firebase config values to your `.env.local` file

5. **Start the development server**

```bash
# Using npm
npm run dev

# Using yarn
yarn dev
```

6. **Open the application**

Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

The project follows the standard Next.js structure with the App Router:

- `/src/app`: Contains Next.js app router pages
- `/src/components`: Reusable UI components
- `/src/lib`: Utility functions and modules
  - `/src/lib/firebase`: Firebase configuration and utilities
  - `/src/lib/ai`: AI-related utilities

## Available Pages

- `/`: Home page
- `/login`: Authentication page
- `/upload`: Upload study materials
- `/quiz`: Take quizzes
- `/summary`: View quiz results and AI-generated cheat sheets
- `/dashboard`: User dashboard with quiz history

## Troubleshooting

### Firebase Authentication Issues

If you encounter issues with Firebase authentication:

1. Double-check your Firebase configuration in the `.env.local` file
2. Ensure you've enabled Email/Password authentication in Firebase Console
3. Check the browser console for specific error messages

### Development Server Issues

If the development server fails to start:

1. Make sure all dependencies are installed: `npm install`
2. Clear the Next.js cache: `npx next clean`
3. Restart the development server: `npm run dev`

## Contact and Support

For support, reach out to us at support@nidoe.app or open an issue on the GitHub repository. 