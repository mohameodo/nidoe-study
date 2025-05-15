"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import QuizContainer, { Quiz, QuizResults } from "@/components/quiz/QuizContainer"
import { useAuth } from "@/components/layouts/ClientRootLayout"

export default function QuizPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()
  
  useEffect(() => {
    // Try to get quiz from session storage (for free users)
    const loadQuiz = () => {
      try {
        const storedQuiz = sessionStorage.getItem('currentQuiz')
        if (storedQuiz) {
          const parsedQuiz = JSON.parse(storedQuiz)
          
          // Validate the quiz structure
          if (!parsedQuiz.title || !Array.isArray(parsedQuiz.questions)) {
            console.error("Invalid quiz format:", parsedQuiz)
            setError("Invalid quiz format. Please generate a new quiz.")
            setLoading(false)
            return
          }
          
          // Make sure questions have all required fields
          const validatedQuestions = parsedQuiz.questions.map((q: any) => ({
            type: q.type || "multipleChoice",
            question: q.question || "Unknown question",
            options: Array.isArray(q.options) ? q.options : ["No options available"],
            correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
            explanation: q.explanation || "No explanation provided"
          }))
          
          // Create a properly formatted quiz object
          const formattedQuiz: Quiz = {
            title: parsedQuiz.title,
            questions: validatedQuestions,
            createdAt: parsedQuiz.createdAt || new Date().toISOString()
          }
          
          setQuiz(formattedQuiz)
        } else {
          setError("No quiz found. Please generate a new quiz.")
        }
      } catch (err) {
        console.error("Error loading quiz:", err)
        setError("Error loading quiz data.")
      } finally {
        setLoading(false)
      }
    }
    
    loadQuiz()
  }, [])
  
  const handleQuizComplete = (results: QuizResults) => {
    // Save results temporarily for the results page
    sessionStorage.setItem('quizResults', JSON.stringify({
      ...results,
      questions: quiz?.questions || [] // Include the questions for the summary page
    }))
    
    // Clear the current quiz
    sessionStorage.removeItem('currentQuiz')
    
    // Redirect to summary page with score parameters
    router.push(`/summary?score=${results.score}&total=${results.totalQuestions}`)
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
          <h1 className="text-xl font-bold mb-4">No Quiz Found</h1>
          <p className="text-muted-foreground mb-6">
            There isn't an active quiz. Please generate a new quiz to start learning.
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