"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, Sliders, Brain, List, X, Settings, Loader2 } from "lucide-react"
import { FileParser } from "@/lib/fileParser"
import { db } from "@/lib/firebase/config"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useAuth } from "@/components/layouts/ClientRootLayout"
import { getGeminiQuiz } from "@/lib/gemini"
import { cn } from "@/lib/utils"

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<"file" | "text">("file")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [questionCount, setQuestionCount] = useState(5)
  const [showSettings, setShowSettings] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState(0)
  const router = useRouter()
  const { user } = useAuth()
  
  const [freePlaysUsed, setFreePlaysUsed] = useState(0)
  
  useEffect(() => {
    // Check local storage for number of free plays used
    const playsUsed = localStorage.getItem('freePlaysUsed')
    if (playsUsed) {
      setFreePlaysUsed(parseInt(playsUsed, 10))
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setActiveTab("file")
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    if (e.target.value.trim() !== "") {
      setActiveTab("text")
    }
  }

  const toggleSettings = () => {
    setShowSettings(!showSettings)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    setGeneratedQuestions(0)
    
    try {
      // Check if user can generate quiz
      if (!user && freePlaysUsed >= 2) {
        throw new Error("You've used all your free quizzes. Please sign in to continue.")
      }
      
      // Process the content (file or text)
      let content = ""
      if (activeTab === "file" && file) {
        // Parse the file content
        if (FileParser.isSupportedFileType(file)) {
          content = await FileParser.parseFile(file)
        } else {
          throw new Error("Unsupported file type")
        }
      } else if (activeTab === "text" && text.trim()) {
        content = text
      } else {
        throw new Error("Please provide study material")
      }
      
      // Mock the question generation progress
      const mockGenerationInterval = setInterval(() => {
        setGeneratedQuestions(prev => {
          const next = prev + 1
          return next > questionCount ? questionCount : next
        })
      }, 700)
      
      // Generate quiz using Google Gemini
      const quiz = await getGeminiQuiz(content, {
        difficulty,
        questionCount,
        onProgress: (count) => {
          setGeneratedQuestions(count)
        }
      })
      
      clearInterval(mockGenerationInterval)
      setGeneratedQuestions(questionCount)
      
      // Validate that each question has the type property (required by QuizContainer)
      const validatedQuestions = quiz.questions.map(q => {
        return {
          type: q.type || "multipleChoice",
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "No explanation provided"
        }
      })
      
      const formattedQuiz = {
        ...quiz,
        questions: validatedQuestions
      }
      
      // Save quiz to Firestore if user is logged in
      let quizId = ""
      if (user) {
        const quizRef = await addDoc(collection(db, "quizzes"), {
          userId: user.uid,
          title: formattedQuiz.title,
          questions: formattedQuiz.questions,
          difficulty,
          questionCount,
          createdAt: serverTimestamp(),
          completed: false
        })
        quizId = quizRef.id
      } else {
        // For free users, store in localStorage
        const newCount = freePlaysUsed + 1
        localStorage.setItem('freePlaysUsed', newCount.toString())
        setFreePlaysUsed(newCount)
        
        // Store quiz in session storage for non-authenticated users
        sessionStorage.setItem('currentQuiz', JSON.stringify({
          title: formattedQuiz.title,
          questions: formattedQuiz.questions,
          createdAt: new Date().toISOString()
        }))
      }
      
      // Redirect to quiz page
      router.push(user ? `/quiz/${quizId}` : "/quiz")
    } catch (error: any) {
      console.error("Upload error:", error)
      alert(error.message || "Error processing your study material. Please try again.")
      setIsUploading(false)
      setGeneratedQuestions(0)
    }
  }

  return (
    <div className="container py-8 mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Upload Study Material</h1>
        <p className="text-muted-foreground mt-2">
          Upload a file or enter your notes to generate a quiz
        </p>
      </div>

      {/* Tab selectors with settings icon */}
      <div className="flex justify-between mb-6 border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab("file")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "file"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="h-4 w-4 inline mr-2" />
            Upload File
          </button>
          <button
            onClick={() => setActiveTab("text")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "text"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Enter Text
          </button>
        </div>
        <button
          onClick={toggleSettings}
          className="px-4 py-2 font-medium text-sm flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Quiz Settings"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 gap-8">
          {activeTab === "file" && (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed rounded-2xl p-10 text-center hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.docx,.txt,.pptx"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Drag and drop or click to upload
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Supports PDF, DOCX, TXT, PPTX (Max 10MB)
                </p>
                {file && (
                  <div className="mt-4 p-2 bg-accent rounded-lg text-sm">
                    {file.name}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === "text" && (
            <div className="space-y-4">
              <textarea
                className="w-full h-[300px] rounded-2xl border bg-background p-4 text-sm resize-none"
                placeholder="Paste or type your study notes here..."
                value={text}
                onChange={handleTextChange}
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter your notes, textbook content, or any study material to generate a quiz
              </p>
            </div>
          )}
        </div>

        {/* Settings popup/dialog */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-lg flex items-center gap-2">
                  <Sliders className="h-4 w-4" />
                  Quiz Customization
                </h3>
                <button
                  type="button"
                  onClick={toggleSettings}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4" /> Difficulty Level
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDifficulty("easy")}
                      className={`px-4 py-2 rounded-xl text-sm flex-1 ${
                        difficulty === "easy"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border hover:bg-accent/50"
                      }`}
                    >
                      Easy
                    </button>
                    <button
                      type="button"
                      onClick={() => setDifficulty("medium")}
                      className={`px-4 py-2 rounded-xl text-sm flex-1 ${
                        difficulty === "medium"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border hover:bg-accent/50"
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      type="button"
                      onClick={() => setDifficulty("hard")}
                      className={`px-4 py-2 rounded-xl text-sm flex-1 ${
                        difficulty === "hard"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border hover:bg-accent/50"
                      }`}
                    >
                      Hard
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <List className="h-4 w-4" /> Number of Questions: {questionCount}
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    className={cn(
                      "w-full h-2 rounded-lg appearance-none cursor-pointer", 
                      "accent-primary bg-accent"
                    )}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>3</span>
                    <span>10</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={toggleSettings}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading state overlay */}
        {isUploading && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card rounded-2xl p-8 shadow-lg max-w-md w-full text-center">
              <div className="flex flex-col items-center">
                <div className="mb-4 relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                    {Math.round((generatedQuestions / questionCount) * 100)}%
                  </div>
                </div>
                <h3 className="text-xl font-medium mb-2">Generating Quiz</h3>
                <p className="text-muted-foreground mb-4">
                  Creating {generatedQuestions} of {questionCount} questions...
                </p>
                <div className="w-full bg-muted rounded-full h-2 mb-6">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(generatedQuestions / questionCount) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Please wait while we analyze your content and generate tailored questions
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={(activeTab === "file" && !file) || (activeTab === "text" && !text.trim()) || isUploading}
            className="rounded-2xl bg-primary px-8 py-3 font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isUploading ? "Processing..." : "Generate Quiz"}
          </button>
        </div>
      </form>
    </div>
  )
} 