"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Download, Share2, CheckCircle, X, Copy, Twitter, Printer, Check, BookOpen, Brain, FileText } from "lucide-react"
import { useAuth } from "@/components/layouts/ClientRootLayout"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
// @ts-ignore
import html2canvas from "html2canvas"
// @ts-ignore
import jsPDF from "jspdf"

export default function SummaryPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const score = searchParams.get("score")
  const total = searchParams.get("total")
  const quizId = searchParams.get("quizId")
  const [loading, setLoading] = useState(true)
  const [quizResults, setQuizResults] = useState<any>(null)
  const [resultsError, setResultsError] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"initial" | "saving" | "saved" | "error">("initial")
  const summaryRef = useRef<HTMLDivElement>(null)
  
  // Save results to Firestore
  const saveResultsToFirestore = async () => {
    if (!user || !quizResults || saveStatus === "saved") return
    
    try {
      setSaveStatus("saving")
      
      const resultsData = {
        userId: user.uid,
        score: Number(score),
        totalQuestions: Number(total),
        timeSpent: quizResults.timeSpent || 0,
        correctAnswers: quizResults.score || 0,
        quizId: quizId || null,
        quizTitle: quizResults.title || `Quiz completed on ${new Date().toLocaleDateString()}`,
        createdAt: serverTimestamp(),
        answers: quizResults.answers || []
      }
      
      await addDoc(collection(db, "quizResults"), resultsData)
      setSaveStatus("saved")
    } catch (error) {
      console.error("Error saving results:", error)
      setSaveStatus("error")
    }
  }
  
  useEffect(() => {
    // Load the quiz results from session storage
    const loadResults = () => {
      try {
        const storedResults = sessionStorage.getItem('quizResults')
        if (storedResults) {
          const parsed = JSON.parse(storedResults)
          
          // Basic validation
          if (!parsed || typeof parsed !== 'object') {
            console.error('Invalid quiz results format', parsed)
            setResultsError('Invalid quiz results format')
            return
          }
          
          setQuizResults(parsed)
        }
      } catch (err) {
        console.error("Error loading quiz results:", err)
        setResultsError("Error loading quiz results")
      }
    }
    
    loadResults()
    
    // Simulate loading the AI-generated content
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Save to Firestore when results are loaded
  useEffect(() => {
    if (user && quizResults && saveStatus === "initial") {
      saveResultsToFirestore()
    }
  }, [user, quizResults, saveStatus])
  
  // Get time spent in a readable format
  const formatTimeSpent = (seconds: number) => {
    if (!seconds) return "N/A";
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins === 0) {
      return `${secs} seconds`;
    } else if (mins === 1) {
      return `1 minute ${secs} seconds`;
    } else {
      return `${mins} minutes ${secs} seconds`;
    }
  };
  
  // Generate and download PDF
  const generatePDF = async () => {
    if (!summaryRef.current) return;
    
    try {
      const canvas = await html2canvas(summaryRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`quiz-results-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };
  
  // Copy link to clipboard
  const copyToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };
  
  // Share on Twitter
  const shareOnTwitter = () => {
    const text = `I scored ${score}/${total} on this quiz! Check out Nidoe Smart Study Helper!`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
  };
  
  // Safely render questions and answers
  const renderQuizAnswers = () => {
    if (!quizResults?.answers || !Array.isArray(quizResults.answers)) {
      return (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h3 className="font-medium">No detailed results available</h3>
          <p className="mt-2 text-sm">We couldn't find detailed information about your answers.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {quizResults.answers.map((answer: any, index: number) => {
          // Get the question safely
          const questionIndex = answer?.questionIndex !== undefined ? answer.questionIndex : index;
          const question = quizResults.questions && Array.isArray(quizResults.questions) 
            ? quizResults.questions[questionIndex] 
            : null;
            
          if (!question) return null;
          
          return (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${
                answer.isCorrect 
                  ? "border-green-200 bg-green-50 dark:bg-green-900/10" 
                  : "border-red-200 bg-red-50 dark:bg-red-900/10"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  answer.isCorrect ? "bg-green-500" : "bg-red-500"
                } text-white mt-1`}>
                  {answer.isCorrect ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2">{question.question}</p>
                  
                  {question.type === "multipleChoice" && question.options && Array.isArray(question.options) && (
                    <div className="space-y-1 mb-3">
                      {question.options.map((option: string, optIndex: number) => (
                        <div 
                          key={optIndex}
                          className={`px-3 py-1 rounded text-sm ${
                            optIndex === question.correctAnswer 
                              ? "bg-green-100 dark:bg-green-900/20 border-l-2 border-green-500" 
                              : ""
                          }`}
                        >
                          {option}
                          {optIndex === question.correctAnswer && (
                            <span className="ml-2 text-xs text-green-700 dark:text-green-400">
                              (Correct answer)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {question.explanation && (
                    <div className="text-sm text-muted-foreground bg-background p-2 rounded">
                      <span className="font-medium">Explanation:</span> {question.explanation}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  if (!score || !total) {
    // Handle case where parameters are missing
    return (
      <div className="container max-w-4xl py-12 mx-auto text-center">
        <h1 className="text-3xl font-bold mb-6">Invalid Summary</h1>
        <p className="mb-6">Could not find quiz results. Please go back and try again.</p>
        <Link
          href="/"
          className="rounded-2xl bg-primary px-6 py-3 font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
        >
          Go Home
        </Link>
      </div>
    )
  }
  
  return (
    <div className="container max-w-4xl py-8 mx-auto">
      {/* Ad slot (placeholder) */}
      <div className="mb-8 p-4 bg-card rounded-lg border border-dashed border-muted-foreground/50 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-xs">ADVERTISEMENT</p>
          <p className="text-sm">Your ad could be here</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-8">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <div className="flex gap-2">
          <div className="relative">
            <button 
              onClick={() => setShareOpen(!shareOpen)}
              className="rounded-full p-2 hover:bg-accent" 
              aria-label="Share results"
            >
              <Share2 className="h-5 w-5" />
            </button>
            
            {shareOpen && (
              <div className="absolute top-full right-0 mt-2 bg-card shadow-lg rounded-lg p-3 w-48 z-50 border">
                <div className="space-y-2">
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 w-full p-2 hover:bg-accent rounded-md text-sm"
                  >
                    {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {linkCopied ? "Copied!" : "Copy link"}
                  </button>
                  <button 
                    onClick={shareOnTwitter}
                    className="flex items-center gap-2 w-full p-2 hover:bg-accent rounded-md text-sm"
                  >
                    <Twitter className="h-4 w-4" />
                    Share on X
                  </button>
                  <button 
                    onClick={generatePDF}
                    className="flex items-center gap-2 w-full p-2 hover:bg-accent rounded-md text-sm"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 w-full p-2 hover:bg-accent rounded-md text-sm"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </button>
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={generatePDF}
            className="rounded-full p-2 hover:bg-accent" 
            aria-label="Download results"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div ref={summaryRef}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-2xl p-6 shadow-sm md:col-span-1 flex flex-col items-center justify-center text-center">
            <h2 className="text-lg font-semibold mb-2">Your Score</h2>
            <div className="text-5xl font-bold mb-2">
              {score}/{total}
            </div>
            <p className="text-muted-foreground">
              {Number(score) === Number(total)
                ? "Perfect! 🎉"
                : Number(score) >= Number(total) * 0.7
                ? "Great job! 👏"
                : "Keep studying! 💪"}
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              {saveStatus === "saved" && user && (
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Results saved</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-card rounded-2xl p-6 shadow-sm md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Quiz Overview</h2>
              <button 
                onClick={() => router.push(quizId ? `/quiz/${quizId}` : '/dashboard')}
                className="text-sm underline"
              >
                View Quiz
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between pb-2 border-b">
                <span>Completion Time</span>
                <span className="font-medium">
                  {quizResults?.timeSpent 
                    ? formatTimeSpent(quizResults.timeSpent) 
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b">
                <span>Accuracy</span>
                <span className="font-medium">{Math.round((Number(score) / Number(total)) * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Questions Attempted</span>
                <span className="font-medium">{total}/{total}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs for different summary sections */}
        <div className="flex border-b mb-6 overflow-x-auto">
          <button 
            className="px-4 py-2 border-b-2 border-primary font-medium text-sm"
          >
            Questions & Answers
          </button>
          <button
            className="px-4 py-2 border-b-2 border-transparent text-muted-foreground font-medium text-sm"
            onClick={() => alert("Coming soon!")}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Cheat Sheet
          </button>
          <button
            className="px-4 py-2 border-b-2 border-transparent text-muted-foreground font-medium text-sm"
            onClick={() => alert("Coming soon!")}
          >
            <BookOpen className="h-4 w-4 inline mr-2" />
            Study Notes
          </button>
          <button
            className="px-4 py-2 border-b-2 border-transparent text-muted-foreground font-medium text-sm"
            onClick={() => alert("Coming soon!")}
          >
            <Brain className="h-4 w-4 inline mr-2" />
            AI Insights
          </button>
        </div>
        
        <div className="bg-card rounded-2xl p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-6">
            {quizResults?.title || "Quiz Results"} 
          </h2>
          
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-6 bg-secondary rounded w-1/3"></div>
              <div className="h-4 bg-secondary rounded w-full"></div>
              <div className="h-4 bg-secondary rounded w-full"></div>
              <div className="h-4 bg-secondary rounded w-3/4"></div>
              <div className="h-6 bg-secondary rounded w-1/3 mt-6"></div>
              <div className="h-4 bg-secondary rounded w-full"></div>
              <div className="h-4 bg-secondary rounded w-full"></div>
            </div>
          ) : resultsError ? (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h3 className="font-medium text-red-700 dark:text-red-300">Error Loading Results</h3>
              <p className="mt-2 text-sm">{resultsError}</p>
              <p className="mt-4 text-sm">We'll show you some general study information instead.</p>
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Study Tips</h3>
                  <ul className="space-y-2 list-disc pl-5">
                    <li>Review your mistakes to understand where you went wrong</li>
                    <li>Take short breaks between study sessions to improve retention</li>
                    <li>Use spaced repetition to remember facts longer</li>
                    <li>Try explaining concepts in your own words</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {quizResults?.questions && Array.isArray(quizResults.questions) && quizResults.questions.length > 0 ? (
                // Show actual quiz questions and correct answers
                <div className="space-y-6">
                  {renderQuizAnswers()}
                </div>
              ) : (
                // Default sections if no quiz data is available
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h3 className="font-medium">No detailed results available</h3>
                  <p className="mt-2 text-sm">We couldn't find detailed information about your answers.</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Cheat Sheet (coming soon) */}
        <div className="bg-card rounded-2xl p-6 shadow-sm mb-8 text-center border border-dashed">
          <h2 className="text-xl font-semibold mb-3">Cheat Sheet</h2>
          <p className="text-muted-foreground mb-4">
            AI-generated study notes with key points to remember
          </p>
          <div className="py-8">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-medium">Coming Soon!</p>
            <p className="text-sm text-muted-foreground">
              We're working on generating personalized cheat sheets for your study materials.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/upload"
          className="rounded-2xl border bg-background px-6 py-3 font-medium shadow-sm hover:bg-accent/50 transition-all"
        >
          New Quiz
        </Link>
        <Link
          href="/dashboard"
          className="rounded-2xl bg-primary px-6 py-3 font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
} 