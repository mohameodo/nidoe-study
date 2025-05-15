"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Clock, FileText, Calendar, ChevronRight, ListFilter, BarChart3 } from "lucide-react"
import { useUserCollection } from "@/lib/hooks/use-firestore"
import { orderBy } from "firebase/firestore"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDistanceToNow, formatDate } from "@/lib/utils"
import { auth } from "@/lib/firebase/config"
import { onAuthStateChanged, User } from "firebase/auth"
import Link from "next/link"

// Type definition for history data
type HistoryItem = {
  id: string
  userId: string
  type: "quiz_completed" | "quiz_started" | "quiz_created" | "upload" | "login"
  timestamp: string
  details: {
    title?: string
    score?: number
    totalQuestions?: number
    timeSpent?: number
    fileName?: string
    fileType?: string
    quizId?: string
  }
}

export default function HistoryPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [])
  
  // Fetch user's activity history with real-time updates
  const { data: historyItems, loading: historyLoading, error } = useUserCollection<HistoryItem>(
    "userHistory",
    user?.uid,
    [orderBy("timestamp", "desc")]
  )
  
  // Filter history items by type if a filter is active
  const filteredItems = activeFilter 
    ? historyItems?.filter(item => item.type === activeFilter) 
    : historyItems
  
  // Derived states
  const isLoading = authLoading || historyLoading
  const hasHistory = filteredItems && filteredItems.length > 0
  
  if (!authLoading && !user) {
    router.push('/login')
    return null
  }
  
  // Group history items by date for better organization
  const groupedByDate = filteredItems?.reduce((acc, item) => {
    const date = new Date(item.timestamp).toDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(item)
    return acc
  }, {} as Record<string, HistoryItem[]>) || {}
  
  return (
    <div className="container max-w-4xl py-4 md:py-8">
      <h1 className="hidden md:block text-3xl font-bold mb-6">Activity History</h1>
      
      {/* Filters */}
      <div className="flex overflow-x-auto scrollbar-none gap-2 mb-4 pb-2">
        <button
          onClick={() => setActiveFilter(null)}
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium ${
            activeFilter === null ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
        >
          All Activity
        </button>
        <button
          onClick={() => setActiveFilter("quiz_completed")}
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium ${
            activeFilter === "quiz_completed" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
        >
          Completed Quizzes
        </button>
        <button
          onClick={() => setActiveFilter("quiz_started")}
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium ${
            activeFilter === "quiz_started" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
        >
          Started Quizzes
        </button>
        <button
          onClick={() => setActiveFilter("quiz_created")}
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium ${
            activeFilter === "quiz_created" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
        >
          Created Quizzes
        </button>
        <button
          onClick={() => setActiveFilter("upload")}
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium ${
            activeFilter === "upload" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
        >
          Uploads
        </button>
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-5 w-32 bg-muted rounded mb-3"></div>
              <div className="rounded-xl border p-4">
                <div className="h-6 w-3/4 bg-muted rounded mb-3"></div>
                <div className="h-4 w-1/2 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="Error loading history"
          description={error.message}
          action={
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
            >
              Refresh
            </button>
          }
        />
      )}
      
      {/* Empty state */}
      {!isLoading && !error && !hasHistory && (
        <EmptyState
          icon={<Clock className="h-16 w-16" />}
          title="No activity yet"
          description="Your activity history will appear here as you use the app."
          action={
            <Link href="/upload" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center">
              Start a Quiz
            </Link>
          }
        />
      )}
      
      {/* History items */}
      {!isLoading && hasHistory && (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([date, items]) => (
            <div key={date} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDate(new Date(date))}
              </h3>
              
              <div className="space-y-3">
                {items.map(item => (
                  <HistoryCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryCard({ item }: { item: HistoryItem }) {
  // Determine icon and title based on activity type
  let icon = <Clock className="h-5 w-5 text-primary" />
  let title = "Activity"
  let details = ""
  let linkPath = ""
  
  switch (item.type) {
    case "quiz_completed":
      icon = <BarChart3 className="h-5 w-5 text-green-500" />
      title = `Completed: ${item.details.title || "Quiz"}`
      details = `Score: ${item.details.score}/${item.details.totalQuestions} (${Math.round((item.details.score! / item.details.totalQuestions!) * 100)}%)`
      linkPath = item.details.quizId ? `/summary?quizId=${item.details.quizId}` : ""
      break
    case "quiz_started":
      icon = <FileText className="h-5 w-5 text-orange-500" />
      title = `Started: ${item.details.title || "Quiz"}`
      details = "In progress"
      linkPath = item.details.quizId ? `/quiz/${item.details.quizId}` : ""
      break
    case "quiz_created":
      icon = <FileText className="h-5 w-5 text-primary" />
      title = `Created: ${item.details.title || "Quiz"}`
      details = `${item.details.totalQuestions} questions`
      linkPath = item.details.quizId ? `/quiz/${item.details.quizId}` : ""
      break
    case "upload":
      icon = <FileText className="h-5 w-5 text-blue-500" />
      title = `Uploaded: ${item.details.fileName || "File"}`
      details = item.details.fileType || ""
      break
    case "login":
      icon = <Clock className="h-5 w-5 text-muted-foreground" />
      title = "Logged in"
      details = "Session started"
      break
  }
  
  return (
    <div className="bg-card rounded-xl border p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start">
        <div className="mr-3 mt-0.5">{icon}</div>
        <div className="flex-1">
          <h4 className="font-medium text-base">{title}</h4>
          <p className="text-sm text-muted-foreground">{details}</p>
          <div className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(item.timestamp))}
          </div>
        </div>
        
        {linkPath && (
          <Link 
            href={linkPath} 
            className="flex items-center text-sm text-primary hover:underline"
          >
            View
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        )}
      </div>
    </div>
  )
} 