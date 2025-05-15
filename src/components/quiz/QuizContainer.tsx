"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, CheckCircle2, BarChart, Check, X, RefreshCcw, XCircle } from "lucide-react"
import AnswerBlock, { QuizQuestion } from "@/components/quiz/AnswerBlock"
import { useAuth } from "@/components/layouts/ClientRootLayout"
import { useSettings } from "@/lib/context/settings-context"
import { db } from "@/lib/firebase/config"
import { doc, updateDoc, addDoc, collection, getDoc, setDoc } from "firebase/firestore"
import { cn } from "@/lib/utils"

export type Quiz = {
  id?: string
  title: string
  questions: QuizQuestion[]
  createdAt: string
}

type QuizContainerProps = {
  quiz: Quiz
  onComplete?: (results: QuizResults) => void
}

export type QuizResults = {
  quizId?: string
  score: number
  totalQuestions: number
  answers: Array<{
    questionIndex: number
    isCorrect: boolean
  }>
  timeSpent: number
}

// Type for saved answer data
type SavedAnswerData = {
  quizId: string;
  answers: Array<{
    questionIndex: number;
    answer: any;
    isCorrect?: boolean;
  }>;
  lastUpdated: number;
  currentQuestionIndex: number;
};

export default function QuizContainer({ quiz, onComplete }: QuizContainerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Array<{
    answer: any, 
    isCorrect?: boolean,
    questionIndex?: number
  }>>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { user } = useAuth()
  const { settings } = useSettings()
  
  // Check if we should load saved answers on initial load
  useEffect(() => {
    const loadSavedAnswers = async () => {
      if (!user || !quiz.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Check if there are saved progress for this quiz
        const savedAnswersRef = doc(db, "userQuizProgress", `${user.uid}_${quiz.id}`);
        const savedAnswersSnap = await getDoc(savedAnswersRef);
        
        if (savedAnswersSnap.exists()) {
          const savedData = savedAnswersSnap.data() as SavedAnswerData;
          
          // Only restore if data is less than 24 hours old
          const isRecent = (Date.now() - savedData.lastUpdated) < (24 * 60 * 60 * 1000);
          
          if (isRecent) {
            // Restore saved answers
            setUserAnswers(savedData.answers);
            setCurrentQuestionIndex(savedData.currentQuestionIndex);
            
            // If all questions were answered, mark as completed
            if (savedData.answers.length === quiz.questions.length) {
              setQuizCompleted(true);
            }
          }
        }
      } catch (error) {
        console.error("Error loading saved answers:", error);
      }
      
      setIsLoading(false);
    };
    
    loadSavedAnswers();
  }, [quiz.id, user, quiz.questions.length]);
  
  // Validate that quiz and questions exist
  if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto px-4 text-center">
        <div className="p-6 bg-card rounded-xl shadow-sm">
          <h1 className="text-xl font-bold mb-4">Invalid Quiz Data</h1>
          <p className="text-muted-foreground mb-6">
            The quiz data is missing or in an invalid format. Please try another quiz.
          </p>
          <button
            onClick={() => router.push('/upload')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Create New Quiz
          </button>
        </div>
      </div>
    )
  }
  
  const currentQuestion = quiz.questions[currentQuestionIndex]
  const totalQuestions = quiz.questions.length
  const answeredQuestions = userAnswers.length
  
  // Check if the current question has been answered before
  const getAnswerForCurrentQuestion = () => {
    return userAnswers.find(answer => 
      answer.hasOwnProperty('questionIndex') 
        ? answer.questionIndex === currentQuestionIndex 
        : userAnswers.indexOf(answer) === currentQuestionIndex
    );
  };
  
  // Track if this question has been answered
  const isCurrentQuestionAnswered = userAnswers.some(answer => 
    answer.hasOwnProperty('questionIndex') 
      ? answer.questionIndex === currentQuestionIndex 
      : userAnswers.indexOf(answer) === currentQuestionIndex
  );
  
  // We only know correctness after quiz is completed
  const correctAnswers = quizCompleted 
    ? userAnswers.filter(a => a.isCorrect).length 
    : 0
  
  // Save current progress to Firestore
  const saveProgress = async (newAnswers: Array<{
    answer: any, 
    isCorrect?: boolean,
    questionIndex?: number
  }>) => {
    if (!user || !quiz.id) return;
    
    try {
      // Format the data to save
      const answersWithIndices = newAnswers.map((answer, index) => ({
        ...answer,
        questionIndex: answer.questionIndex !== undefined ? answer.questionIndex : index
      }));
      
      // Data to save
      const progressData: SavedAnswerData = {
        quizId: quiz.id,
        answers: answersWithIndices,
        lastUpdated: Date.now(),
        currentQuestionIndex: currentQuestionIndex
      };
      
      // Save to Firestore
      const progressRef = doc(db, "userQuizProgress", `${user.uid}_${quiz.id}`);
      await setDoc(progressRef, progressData);
      
      // Also update the quiz document to show it's in progress
      if (!quizCompleted) {
        await updateDoc(doc(db, "quizzes", quiz.id), {
          lastUpdated: new Date().toISOString(),
          inProgress: true
        });
      }
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };
  
  // Handle when user answers a question
  const handleAnswered = (answer: any) => {
    // Create a copy of the current answers array
    let newAnswers = [...userAnswers];
    
    // Check if this question already has an answer
    const existingAnswerIndex = newAnswers.findIndex(a => 
      a.hasOwnProperty('questionIndex') 
        ? a.questionIndex === currentQuestionIndex 
        : newAnswers.indexOf(a) === currentQuestionIndex
    );
    
    if (existingAnswerIndex !== -1) {
      // Update existing answer
      newAnswers[existingAnswerIndex] = { 
        ...newAnswers[existingAnswerIndex], 
        answer,
        questionIndex: currentQuestionIndex 
      };
    } else {
      // Add new answer
      newAnswers.push({ 
        answer, 
        questionIndex: currentQuestionIndex 
      });
    }
    
    // Update state
    setUserAnswers(newAnswers);
    
    // Save progress to Firestore
    saveProgress(newAnswers);
    
    // If this is the last question, mark as completed
    if (currentQuestionIndex === totalQuestions - 1 && newAnswers.filter(a => a.hasOwnProperty('questionIndex')).length === totalQuestions) {
      evaluateAnswers(newAnswers);
      setQuizCompleted(true);
    }
  }
  
  // Evaluate answers without showing results
  const evaluateAnswers = (answers = userAnswers) => {
    // Now evaluate all answers at once
    const evaluatedAnswers = answers.map((answerData) => {
      const questionIndex = answerData.questionIndex !== undefined ? answerData.questionIndex : answers.indexOf(answerData);
      const question = quiz.questions[questionIndex];
      let isCorrect = false;
      
      if (question.type === "multipleChoice") {
        isCorrect = answerData.answer === question.correctAnswer;
      } else if (question.type === "shortAnswer") {
        const normalizedUserAnswer = String(answerData.answer).trim().toLowerCase();
        isCorrect = question.answers.some(
          correctAnswer => correctAnswer.toLowerCase() === normalizedUserAnswer
        );
      } else if (question.type === "matching") {
        // Check if all matches are correct
        isCorrect = Object.entries(answerData.answer).every(
          ([termIndex, defIndex]) => 
            question.pairs[Number(termIndex)].definition === question.pairs[Number(defIndex)].definition
        );
      } else if (question.type === "puzzle") {
        // A puzzle is correct if all steps were answered correctly
        isCorrect = answerData.answer.every((step: boolean) => step);
      }
      
      return { 
        ...answerData, 
        isCorrect,
        questionIndex 
      };
    });
    
    // Sort answers by question index to ensure correct order
    const sortedAnswers = [...evaluatedAnswers].sort((a, b) => 
      (a.questionIndex !== undefined && b.questionIndex !== undefined) 
        ? a.questionIndex - b.questionIndex 
        : 0
    );
    
    setUserAnswers(sortedAnswers);
    saveProgress(sortedAnswers);
    
    return sortedAnswers;
  }
  
  // Redirect to the summary page
  const redirectToSummary = () => {
    const evaluatedAnswers = evaluateAnswers();
    const score = evaluatedAnswers.filter(a => a.isCorrect).length;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000); // in seconds
    
    // Save quiz result to Firestore if user is logged in
    if (user && quiz.id) {
      updateDoc(doc(db, "quizzes", quiz.id), {
        completed: true,
        inProgress: false,
        results: {
          quizId: quiz.id,
          score: score,
          totalQuestions,
          answers: evaluatedAnswers.map((answer) => ({ 
            questionIndex: answer.questionIndex !== undefined ? answer.questionIndex : 0, 
            isCorrect: !!answer.isCorrect
          })),
          timeSpent
        },
        completedAt: new Date().toISOString()
      }).catch(error => {
        console.error("Error saving quiz results:", error);
      });
    }
    
    // Store quiz results in session storage for the summary page
    sessionStorage.setItem('quizResults', JSON.stringify({
      title: quiz.title,
      score: score,
      totalQuestions,
      questions: quiz.questions,
      answers: evaluatedAnswers.map((answer) => ({ 
        questionIndex: answer.questionIndex !== undefined ? answer.questionIndex : 0, 
        isCorrect: !!answer.isCorrect,
        userAnswer: answer.answer
      })),
      timeSpent
    }));
    
    // Redirect to summary page with query parameters
    router.push(`/summary?score=${score}&total=${totalQuestions}&quizId=${quiz.id || 'custom'}`);
  }
  
  // Create new quiz from incorrect answers
  const createNewQuizFromWrongAnswers = () => {
    if (!quiz || !quiz.questions || !userAnswers) return
    
    const incorrectQuestions = quiz.questions.filter((_, index) => 
      userAnswers[index] && !userAnswers[index].isCorrect
    )
    
    if (incorrectQuestions.length === 0) {
      alert("You answered all questions correctly!")
      return
    }
    
    // Create a new quiz with just the incorrect questions
    const newQuiz = {
      title: `Practice Quiz: ${quiz.title}`,
      questions: incorrectQuestions,
      createdAt: new Date().toISOString(),
      userId: user?.uid || "anonymous"
    }
    
    // Save new quiz to Firestore if user is logged in
    if (user) {
      addDoc(collection(db, "quizzes"), newQuiz)
        .then((docRef) => {
          router.push(`/quiz/${docRef.id}`)
        })
        .catch((error: any) => {
          console.error("Error creating new quiz:", error)
          alert("Failed to create practice quiz. Please try again.")
        })
    } else {
      // Store in session storage and navigate to new quiz page
      sessionStorage.setItem('practiceQuiz', JSON.stringify(newQuiz))
      router.push('/practice-quiz')
    }
  }
  
  // Navigation functions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      
      // Update current question index in Firestore
      if (user && quiz.id) {
        const progressRef = doc(db, "userQuizProgress", `${user.uid}_${quiz.id}`);
        updateDoc(progressRef, {
          currentQuestionIndex: newIndex,
          lastUpdated: Date.now()
        }).catch(error => {
          console.error("Error updating current question:", error);
        });
      }
    }
  }
  
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
      
      // Update current question index in Firestore
      if (user && quiz.id) {
        const progressRef = doc(db, "userQuizProgress", `${user.uid}_${quiz.id}`);
        updateDoc(progressRef, {
          currentQuestionIndex: newIndex,
          lastUpdated: Date.now()
        }).catch(error => {
          console.error("Error updating current question:", error);
        });
      }
    }
  }
  
  // Toggle results view
  const toggleResults = () => {
    setShowResults(!showResults);
  }
  
  // Exit quiz
  const exitQuiz = () => {
    router.push('/dashboard');
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        {/* Main content rendered behind the overlay */}
        <div className="sticky top-0 z-0 bg-background border-b py-3 flex justify-between items-center w-full">
          <div className="ml-4" />
          <h1 className="text-xl font-bold text-center truncate max-w-md px-2">{quiz.title}</h1>
          <div className="mr-4" />
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          {/* Content behind blur */}
        </div>
        
        {/* Full page overlay with blur */}
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-8 rounded-xl shadow-lg text-center max-w-md w-full">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-6"></div>
            <h2 className="text-xl font-bold mb-2">Loading Quiz</h2>
            <p className="text-muted-foreground mb-6">Preparing your quiz experience...</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 border rounded-lg hover:bg-accent/50 transition-colors mx-auto font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Get the previously saved answer for the current question (if any)
  const previousAnswer = getAnswerForCurrentQuestion();
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Custom Quiz Navbar - Full Width */}
      <div className="sticky top-0 z-10 bg-background border-b py-3 flex justify-between items-center w-full">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm font-medium rounded-lg border px-3 py-2 hover:bg-accent/50 transition-colors ml-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        
        <h1 className="text-xl font-bold text-center truncate max-w-md px-2">{quiz.title}</h1>
        
        <button
          onClick={exitQuiz}
          className="flex items-center gap-1 text-sm font-medium rounded-lg border px-3 py-2 hover:bg-accent/50 transition-colors mr-4"
        >
          <XCircle className="h-4 w-4" />
          Exit
        </button>
      </div>
      
      <div className="flex-1 px-4 py-3 max-w-4xl mx-auto w-full">
        {/* Results view */}
        {showResults ? (
          <div className="bg-card rounded-xl p-6 shadow-sm">
            <div className="text-center mb-6">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
              <h2 className="text-2xl font-bold mb-1">Quiz Completed!</h2>
              <p className="text-muted-foreground">
                You got {correctAnswers} out of {totalQuestions} questions right.
              </p>
              <div className="text-3xl font-bold mt-4">
                {Math.round((correctAnswers / totalQuestions) * 100)}%
              </div>
            </div>
            
            <div className="space-y-4 mt-6">
              <h3 className="font-medium">Question Summary</h3>
              {userAnswers.map((answerData, index) => {
                const question = quiz.questions[index]
                const isCorrect = !!answerData.isCorrect
                
                return (
                  <div 
                    key={index}
                    className={cn(
                      "p-3 rounded-lg border",
                      isCorrect ? "border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900" : 
                      "border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900"
                    )}
                  >
                    <div className="flex items-start">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-white mr-3 mt-1",
                        isCorrect ? "bg-green-500" : "bg-red-500"
                      )}>
                        {isCorrect ? 
                          <Check className="h-4 w-4" /> : 
                          <X className="h-4 w-4" />
                        }
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">Question {index + 1}</h4>
                        <p className="text-sm mt-1">{question.question}</p>
                        
                        {question.explanation && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <span className="font-medium">Explanation:</span> {question.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
              <div className="flex gap-3">
                <button
                  onClick={toggleResults}
                  className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-accent/50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Quiz
                </button>
                
                <button
                  onClick={createNewQuizFromWrongAnswers}
                  className="px-4 py-2 border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg flex items-center gap-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Practice Wrong Answers
                </button>
              </div>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <BarChart className="h-4 w-4" />
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Progress indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </div>
                <div className="text-sm font-medium">
                  {userAnswers.filter(a => a.hasOwnProperty('questionIndex')).length}/{totalQuestions} Answered
                </div>
              </div>
              
              {/* Full width progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden w-full">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(userAnswers.filter(a => a.hasOwnProperty('questionIndex')).length / totalQuestions) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Question */}
            <div className="bg-card rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-xl font-medium mb-6 pb-4 border-b">
                {currentQuestion.question}
              </h2>
              
              <AnswerBlock 
                key={`question-${currentQuestionIndex}`}
                question={currentQuestion}
                onAnswered={handleAnswered}
                showExplanation={false}
                hideCorrectness={true}
                previousAnswer={previousAnswer?.answer}
              />
            </div>
            
            {/* Navigation */}
            <div className="flex justify-between items-center mt-4 mb-8">
              <button
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 border rounded-lg flex items-center gap-2 disabled:opacity-50 hover:bg-accent/50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>
              
              <div className="flex gap-3">
                {quizCompleted && (
                  <button
                    onClick={redirectToSummary}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    See Summary
                  </button>
                )}
                
                {isCurrentQuestionAnswered && !quizCompleted && (
                  <button
                    onClick={goToNextQuestion}
                    disabled={currentQuestionIndex === totalQuestions - 1}
                    className="px-6 py-2 border border-primary bg-primary/10 text-primary rounded-lg flex items-center gap-2 hover:bg-primary/20 transition-colors"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                
                {isCurrentQuestionAnswered && currentQuestionIndex === totalQuestions - 1 && !quizCompleted && (
                  <button
                    onClick={() => {
                      evaluateAnswers();
                      setQuizCompleted(true);
                    }}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    Submit
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 