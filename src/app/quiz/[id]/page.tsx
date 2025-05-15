"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { FirestoreQuiz, subscribeToQuiz } from "@/lib/firebase/firestore"
import QuizContainer, { Quiz, QuizResults } from "@/components/quiz/QuizContainer"
import { QuizQuestion, MultipleChoiceQuestion } from "@/components/quiz/AnswerBlock"
import { useAuth } from "@/components/layouts/ClientRootLayout"

export default function QuizByIdPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const quizId = params.id as string
  
  useEffect(() => {
    if (!quizId) {
      setError("Invalid quiz ID")
      setLoading(false)
      return
    }
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToQuiz(quizId, (quizData) => {
      if (quizData) {
        // Map Firestore quiz data to the Quiz format expected by QuizContainer
        try {
          // Map Firestore questions to the expected QuizQuestion format
          const mappedQuestions: QuizQuestion[] = quizData.questions.map(q => {
            // Default to multiple choice if type is missing
            const questionType = q.type || "multipleChoice";
            
            if (questionType === "multipleChoice") {
              return {
                type: "multipleChoice",
                question: q.question || "No question text",
                options: Array.isArray(q.options) ? q.options : ["No options available"],
                correctAnswer: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0,
                explanation: q.explanation || "No explanation provided"
              } as MultipleChoiceQuestion;
            }
            
            // Fall back to a default question format if type is unknown
            return {
              type: "multipleChoice",
              question: q.question || "No question text",
              options: Array.isArray(q.options) ? q.options : ["No options available"],
              correctAnswer: 0,
              explanation: q.explanation || "No explanation provided"
            } as MultipleChoiceQuestion;
          });
          
          // Create the formatted quiz with proper question structure
          const formattedQuiz: Quiz = {
            id: quizData.id,
            title: quizData.title,
            questions: mappedQuestions,
            createdAt: typeof quizData.createdAt === 'string' 
              ? quizData.createdAt 
              : new Date().toISOString()
          }
          
          setQuiz(formattedQuiz)
          setError(null)
        } catch (err) {
          console.error("Error formatting quiz data:", err)
          setError("Error formatting quiz data")
        }
      } else {
        setError("Quiz not found")
      }
      setLoading(false)
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [quizId])
  
  const handleQuizComplete = (results: QuizResults) => {
    // Save results temporarily for the results page
    sessionStorage.setItem('quizResults', JSON.stringify(results))
    
    // For now, we'll just display a success message
    console.log("Quiz completed with results:", results)
    
    // Redirect to summary page with score parameters and quizId
    router.push(`/summary?score=${results.score}&total=${results.totalQuestions}&quizId=${quizId}`)
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading quiz...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto px-4 text-center">
        <div className="p-6 bg-card rounded-xl shadow-sm">
          <h1 className="text-xl font-bold mb-4">Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
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
  
  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto px-4 text-center">
        <div className="p-6 bg-card rounded-xl shadow-sm">
          <h1 className="text-xl font-bold mb-4">Quiz Not Found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find the quiz you're looking for. Please try another quiz or create a new one.
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
  
  return <QuizContainer quiz={quiz} onComplete={handleQuizComplete} />
}
