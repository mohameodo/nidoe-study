import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './config';
import { Question } from '../ai/generation';

// Define a proper quiz type
export interface FirestoreQuiz {
  id?: string;
  userId?: string;
  title: string;
  createdAt: string | Timestamp;
  questions: Array<{
    question: string;
    options: string[];
    correctOptionIndex: number;
    explanation?: string;
    type?: string;
  }>;
  difficulty?: string;
  questionCount?: number;
  completed?: boolean;
  results?: {
    score: number;
    totalQuestions: number;
    timeSpent: number;
  };
}

export interface QuizResult {
  id?: string;
  userId: string;
  title: string;
  createdAt: Timestamp;
  score: number;
  totalQuestions: number;
  duration: number; // in seconds
  questions: Question[];
  answers: { [key: number]: string };
}

export interface CheatSheetData {
  id?: string;
  userId: string;
  title: string;
  createdAt: Timestamp;
  content: string;
  sections: Array<{
    heading: string;
    content: string[];
  }>;
}

/**
 * Save a quiz result to Firestore
 */
export const saveQuizResult = async (quizResult: Omit<QuizResult, 'userId' | 'createdAt'>): Promise<string> => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User must be authenticated to save quiz results');
    }
    
    const docRef = await addDoc(collection(db, 'quizResults'), {
      ...quizResult,
      userId: user.uid,
      createdAt: Timestamp.now()
    });
    
    return docRef.id;
  } catch (error: any) {
    console.error('Error saving quiz result:', error);
    throw new Error(error.message || 'Failed to save quiz result');
  }
};

/**
 * Save a cheat sheet to Firestore
 */
export const saveCheatSheet = async (cheatSheet: Omit<CheatSheetData, 'userId' | 'createdAt'>): Promise<string> => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User must be authenticated to save cheat sheets');
    }
    
    const docRef = await addDoc(collection(db, 'cheatSheets'), {
      ...cheatSheet,
      userId: user.uid,
      createdAt: Timestamp.now()
    });
    
    return docRef.id;
  } catch (error: any) {
    console.error('Error saving cheat sheet:', error);
    throw new Error(error.message || 'Failed to save cheat sheet');
  }
};

/**
 * Get quiz results for the current user
 */
export const getUserQuizResults = async (): Promise<QuizResult[]> => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User must be authenticated to get quiz results');
    }
    
    const q = query(
      collection(db, 'quizResults'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QuizResult));
  } catch (error: any) {
    console.error('Error getting user quiz results:', error);
    throw new Error(error.message || 'Failed to get quiz results');
  }
};

/**
 * Get cheat sheets for the current user
 */
export const getUserCheatSheets = async (): Promise<CheatSheetData[]> => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User must be authenticated to get cheat sheets');
    }
    
    const q = query(
      collection(db, 'cheatSheets'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CheatSheetData));
  } catch (error: any) {
    console.error('Error getting user cheat sheets:', error);
    throw new Error(error.message || 'Failed to get cheat sheets');
  }
};

/**
 * Fetch a quiz by its ID
 */
export const fetchQuizById = async (quizId: string) => {
  try {
    const docRef = doc(db, 'quizzes', quizId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      try {
        const rawData = docSnap.data();
        
        // Create a base object with defaults for missing fields
        const data: FirestoreQuiz = {
          id: docSnap.id,
          title: rawData.title || "Untitled Quiz",
          questions: [],
          createdAt: rawData.createdAt || new Date().toISOString(),
          ...rawData
        };
        
        // Ensure the quiz has the questions array
        if (!data.questions || !Array.isArray(data.questions)) {
          data.questions = [];
          console.warn('Quiz has no questions array, creating empty array');
        }
        
        // Validate and normalize each question
        data.questions = data.questions.map(q => ({
          question: q.question || "No question text",
          options: Array.isArray(q.options) ? q.options : ["No options available"],
          correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0,
          explanation: q.explanation || "No explanation provided",
          type: q.type || "multipleChoice"
        }));
        
        return data;
      } catch (error) {
        console.error('Error formatting quiz data:', error);
        console.error('Raw data:', docSnap.data());
        return {
          id: docSnap.id,
          title: "Error Loading Quiz",
          questions: [],
          createdAt: new Date().toISOString()
        };
      }
    } else {
      console.log('No such quiz document!');
      return null;
    }
  } catch (error: any) {
    console.error('Error fetching quiz:', error);
    throw new Error(error.message || 'Failed to fetch quiz');
  }
};

/**
 * Subscribe to real-time updates for a quiz by ID
 */
export const subscribeToQuiz = (quizId: string, callback: (quiz: FirestoreQuiz | null) => void) => {
  const docRef = doc(db, 'quizzes', quizId);
  
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        try {
          const rawData = docSnap.data();
          
          // Create a base object with defaults for missing fields
          const data: FirestoreQuiz = {
            id: docSnap.id,
            title: rawData.title || "Untitled Quiz",
            questions: [],
            createdAt: rawData.createdAt || new Date().toISOString(),
            ...rawData
          };
          
          // Ensure the quiz has the questions array
          if (!data.questions || !Array.isArray(data.questions)) {
            data.questions = [];
            console.warn('Quiz has no questions array, creating empty array');
          }
          
          // Validate and normalize each question
          data.questions = data.questions.map(q => ({
            question: q.question || "No question text",
            options: Array.isArray(q.options) ? q.options : ["No options available"],
            correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0,
            explanation: q.explanation || "No explanation provided",
            type: q.type || "multipleChoice"
          }));
          
          callback(data);
        } catch (error) {
          console.error('Error formatting quiz data:', error);
          console.error('Raw data:', docSnap.data());
          callback({
            id: docSnap.id,
            title: "Error Loading Quiz",
            questions: [],
            createdAt: new Date().toISOString()
          });
        }
      } else {
        console.log('No such quiz document!');
        callback(null);
      }
    },
    (error) => {
      console.error('Error subscribing to quiz:', error);
      callback(null);
    }
  );
}; 