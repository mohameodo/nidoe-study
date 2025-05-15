# Nidoe Study App

Nidoe is a modern study application that uses AI to generate personalized quizzes from your study materials. This Next.js 14 application features Firebase integration for authentication and data storage, along with Google Gemini AI for quiz generation.

## Features

- **AI-Powered Quiz Generation**: Upload files or paste text to create custom quizzes
- **Multiple Quiz Types**: 
  - Multiple Choice
  - Short Answer
  - Matching Pairs
  - Progressive Puzzles
- **User Authentication**: 
  - Email/Password login
  - Google login
  - Free trial mode (2 quizzes without login)
- **Personalized Dashboard**: Track your progress and quiz history
- **Modern UI**: 
  - Responsive design for all devices
  - Dark/Light mode support
  - Clean black and white design

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Authentication/Database**: Firebase Authentication, Firestore
- **AI Integration**: Google Gemini API
- **Styling**: Tailwind CSS with custom components

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Firebase project with Authentication and Firestore enabled
- Google Gemini API key

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/nidoe-study.git
   cd nidoe-study
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Environment Setup**:
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase and Google Gemini API keys

4. **Run the development server**:
   ```bash
   pnpm dev
   ```

5. **Build for production**:
   ```bash
   pnpm build
   ```

## Project Structure

```
├── src/
│   ├── app/                  # Next.js app router pages
│   ├── components/           # React components
│   │   ├── navigation/       # Navigation components
│   │   ├── quiz/             # Quiz components
│   │   └── ui/               # UI components
│   ├── lib/                  # Utilities and helpers
│   │   ├── context/          # React contexts
│   │   ├── firebase/         # Firebase configuration
│   │   └── gemini.ts         # Gemini AI integration
│   └── styles/               # Global styles
└── public/                   # Static assets
```

## Setting Up Firebase

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication with Email/Password and Google providers
3. Create a Firestore database
4. Create a Web App in your Firebase project to get your API keys
5. Add these keys to your `.env.local` file

## Advanced Features

### Quiz Types

- **Multiple Choice**: Traditional multiple-choice questions
- **Short Answer**: Free text answers with multiple acceptable responses
- **Matching**: Match terms with their definitions
- **Puzzle**: Progressive multi-step questions where each correct answer unlocks the next part

### User Settings

Users can customize their experience with the following settings:

- Enable/disable specific quiz types
- Toggle AI hints and explanations
- Enable progressive unlocking (must answer correctly to proceed)
- Set default difficulty level and number of questions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 