"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileText, BarChart3, Clock, ChevronRight, LayoutGrid, Plus, BookOpen, Brain } from "lucide-react"
import { useUserCollection } from "@/lib/hooks/use-firestore"
import { orderBy } from "firebase/firestore"
import { EmptyState } from "@/components/ui/empty-state"
import { QuizCardSkeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "@/lib/utils"
import { auth } from "@/lib/firebase/config"
import { onAuthStateChanged, User } from "firebase/auth"

// Type definition for Quiz data from Firestore
type QuizData = {
  id: string
  title: string
  createdAt: string
  completed: boolean
  userId: string
  difficulty: string
  questionCount: number
  results?: {
    score: number
    totalQuestions: number
    timeSpent: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [view, setView] = useState<"grid" | "list">("grid")
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [])
  
  // Fetch user's quizzes with real-time updates
  const { data: quizzes, loading: quizzesLoading, error } = useUserCollection<QuizData>(
    "quizzes",
    user?.uid,
    [orderBy("createdAt", "desc")]
  )
  
  // Derived states
  const isLoading = authLoading || quizzesLoading
  const hasQuizzes = quizzes && quizzes.length > 0
  const completedQuizzes = quizzes?.filter(quiz => quiz.completed) || []
  const pendingQuizzes = quizzes?.filter(quiz => !quiz.completed) || []
  
  // Calculate statistics
  const totalQuizzes = quizzes?.length || 0
  const completionRate = totalQuizzes ? Math.round((completedQuizzes.length / totalQuizzes) * 100) : 0
  const averageScore = completedQuizzes.length 
    ? Math.round(completedQuizzes.reduce((acc, quiz) => acc + (quiz.results?.score || 0), 0) / completedQuizzes.length) 
    : 0
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<"quizzes" | "cheatsheet" | "notes" | "insights">("quizzes")
  
  if (!authLoading && !user) {
    router.push('/login')
    return null
  }
  
  return (
    <div className="container max-w-6xl py-4 md:py-8">
      <h1 className="hidden md:block text-3xl font-bold mb-6">Your Dashboard</h1>
      
      {/* Stats overview - Combined into one card - Hidden on mobile */}
      <div className="hidden md:block mb-6">
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            <div className="flex items-center">
              <div className="relative flex items-center justify-center h-14 w-14 mr-4">
                <div className="animate-pulse-slow absolute inset-0 rounded-full bg-primary/10"></div>
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Total Quizzes</h3>
                {isLoading ? (
                  <div className="animate-pulse h-8 w-12 bg-muted rounded-md" />
                ) : (
                  <p className="text-2xl font-bold">{totalQuizzes}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="relative flex items-center justify-center h-14 w-14 mr-4">
                <div className="animate-pulse-slow absolute inset-0 rounded-full bg-primary/10 animation-delay-300"></div>
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Completion Rate</h3>
                {isLoading ? (
                  <div className="animate-pulse h-8 w-16 bg-muted rounded-md" />
                ) : (
                  <p className="text-2xl font-bold">{completionRate}%</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="relative flex items-center justify-center h-14 w-14 mr-4">
                <div className="animate-pulse-slow absolute inset-0 rounded-full bg-primary/10 animation-delay-600"></div>
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Average Score</h3>
                {isLoading ? (
                  <div className="animate-pulse h-8 w-16 bg-muted rounded-md" />
                ) : (
                  <p className="text-2xl font-bold">{averageScore}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* View controls for mobile - above tabs */}
      {activeTab === "quizzes" && (
        <div className="md:hidden flex justify-end mb-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-md ${view === "grid" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 rounded-md ${view === "list" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              aria-label="List view"
            >
              <FileText className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Tabs and view controls - reverted to one line for desktop */}
      <div className="mb-4 border-b">
        <div className="flex justify-between items-center">
          {/* Tabs - horizontally scrollable */}
          <div className="overflow-x-auto scrollbar-none">
            <div className="flex min-w-max">
              <button 
                onClick={() => setActiveTab("quizzes")}
                className={`px-4 py-2 border-b-2 whitespace-nowrap font-medium text-sm ${
                  activeTab === "quizzes" ? "border-primary" : "border-transparent text-muted-foreground"
                }`}
              >
                Your Quizzes
              </button>
              <button
                onClick={() => setActiveTab("cheatsheet")}
                className={`px-4 py-2 border-b-2 whitespace-nowrap font-medium text-sm ${
                  activeTab === "cheatsheet" ? "border-primary" : "border-transparent text-muted-foreground"
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Cheat Sheet
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`px-4 py-2 border-b-2 whitespace-nowrap font-medium text-sm ${
                  activeTab === "notes" ? "border-primary" : "border-transparent text-muted-foreground"
                }`}
              >
                <BookOpen className="h-4 w-4 inline mr-2" />
                Study Notes
              </button>
              <button
                onClick={() => setActiveTab("insights")}
                className={`px-4 py-2 border-b-2 whitespace-nowrap font-medium text-sm ${
                  activeTab === "insights" ? "border-primary" : "border-transparent text-muted-foreground"
                }`}
              >
                <Brain className="h-4 w-4 inline mr-2" />
                AI Insights
              </button>
            </div>
          </div>
          
          {/* View controls for desktop */}
          {activeTab === "quizzes" && (
            <div className="hidden md:flex">
              <div className="flex space-x-2">
                <button
                  onClick={() => setView("grid")}
                  className={`p-2 rounded-md ${view === "grid" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`p-2 rounded-md ${view === "list" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  aria-label="List view"
                >
                  <FileText className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Loading state */}
      {activeTab === "quizzes" && isLoading && (
        <div className={`grid gap-4 ${view === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
          {[1, 2, 3, 4].map(i => (
            <QuizCardSkeleton key={i} />
          ))}
        </div>
      )}
      
      {/* Error state */}
      {activeTab === "quizzes" && error && (
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="Error loading quizzes"
          description={error.message}
          action={
            <Link href="/upload" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg">
              Create New Quiz
            </Link>
          }
        />
      )}
      
      {/* Empty state */}
      {activeTab === "quizzes" && !isLoading && !error && !hasQuizzes && (
        <EmptyState
          icon={<FileText className="h-16 w-16" />}
          title="No quizzes yet"
          description="Create your first quiz now by uploading study material or entering text."
          action={
            <Link href="/upload" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </Link>
          }
        />
      )}
      
      {/* Quizzes grid/list */}
      {activeTab === "quizzes" && !isLoading && hasQuizzes && (
        <>
          {/* Pending quizzes */}
          {pendingQuizzes.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">In Progress</h3>
              <div className={`grid gap-4 ${view === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {pendingQuizzes.map(quiz => (
                  <QuizCard 
                    key={quiz.id} 
                    quiz={quiz}
                    view={view}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Completed quizzes */}
          {completedQuizzes.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Completed</h3>
              <div className={`grid gap-4 ${view === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {completedQuizzes.map(quiz => (
                  <QuizCard 
                    key={quiz.id} 
                    quiz={quiz}
                    view={view}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Cheat Sheet (coming soon) */}
      {activeTab === "cheatsheet" && (
        <div className="bg-card rounded-2xl p-6 shadow-sm mb-8 text-center border border-dashed">
          <h2 className="text-xl font-semibold mb-3">Cheat Sheet</h2>
          <p className="text-muted-foreground mb-4">
            AI-generated study notes with key points to remember
          </p>
          <div className="py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-medium">Coming Soon!</p>
            <p className="text-sm text-muted-foreground">
              We're working on generating personalized cheat sheets for your study materials.
            </p>
          </div>
        </div>
      )}
      
      {/* Study Notes (coming soon) */}
      {activeTab === "notes" && (
        <div className="bg-card rounded-2xl p-6 shadow-sm mb-8 text-center border border-dashed">
          <h2 className="text-xl font-semibold mb-3">Study Notes</h2>
          <p className="text-muted-foreground mb-4">
            Organized notes and summaries of your study material
          </p>
          <div className="py-8">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-medium">Coming Soon!</p>
            <p className="text-sm text-muted-foreground">
              We're developing a smart note-taking system tailored to your learning style.
            </p>
          </div>
        </div>
      )}
      
      {/* AI Insights (coming soon) */}
      {activeTab === "insights" && (
        <div className="bg-card rounded-2xl p-6 shadow-sm mb-8 text-center border border-dashed">
          <h2 className="text-xl font-semibold mb-3">AI Insights</h2>
          <p className="text-muted-foreground mb-4">
            Personalized learning insights powered by AI
          </p>
          <div className="py-8">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-medium">Coming Soon!</p>
            <p className="text-sm text-muted-foreground">
              Our AI is learning how to help you study more effectively based on your performance.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function QuizCard({ quiz, view }: { quiz: QuizData, view: "grid" | "list" }) {
  const isGrid = view === "grid"
  
  return (
    <Link 
      href={`/quiz/${quiz.id}`} 
      className={`bg-card rounded-xl border hover:shadow-md transition-shadow ${
        isGrid ? "p-5" : "p-4 flex justify-between items-center"
      }`}
    >
      <div className={isGrid ? "" : "flex-1"}>
        <h3 className={`font-medium ${isGrid ? "mb-2 line-clamp-2" : ""}`}>{quiz.title}</h3>
        
        <div className={`text-sm text-muted-foreground ${isGrid ? "mb-4" : ""}`}>
          {quiz.completed ? (
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              Completed
            </div>
          ) : (
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
              In Progress
            </div>
          )}
        </div>
        
        {isGrid && (
          <div className="mt-2 flex justify-between items-center text-sm">
            <span className="bg-muted px-2 py-1 rounded text-xs">
              {quiz.difficulty}
            </span>
            <span className="text-xs">
              {formatDistanceToNow(new Date(quiz.createdAt))}
            </span>
          </div>
        )}
      </div>
      
      <div className={isGrid ? "flex items-center justify-between mt-3 pt-3 border-t" : "flex-shrink-0 flex items-center"}>
        {quiz.completed && quiz.results ? (
          <div className="text-sm">
            <span className="font-medium">
              {quiz.results.score}/{quiz.results.totalQuestions}
            </span>
            {!isGrid && (
              <span className="text-muted-foreground ml-2">
                {formatDistanceToNow(new Date(quiz.createdAt))}
              </span>
            )}
          </div>
        ) : (
          <div className="text-sm">
            <span>{quiz.questionCount} questions</span>
          </div>
        )}
        
        <ChevronRight className="h-4 w-4 ml-2 text-muted-foreground" />
      </div>
    </Link>
  )
} 