"use client"

import Link from 'next/link';
import { useState, useEffect } from "react";
import { Pencil, BookOpen, BrainCircuit, BarChart3, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from "@/components/layouts/ClientRootLayout";
import { db } from "@/lib/firebase/config";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { formatDistanceToNow } from "@/lib/utils";

type QuizData = {
  id: string
  title: string
  createdAt: string
  completed: boolean
  inProgress?: boolean
}

export default function Home() {
  const { user, isLoading } = useAuth();
  const [recentQuizzes, setRecentQuizzes] = useState<QuizData[]>([]);
  const [inProgressQuizzes, setInProgressQuizzes] = useState<QuizData[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Fetch user's recent quizzes when they're logged in
  useEffect(() => {
    const fetchUserQuizzes = async () => {
      if (!user) return;
      
      setDataLoading(true);
      try {
        // Get recent completed quizzes
        const completedQuery = query(
          collection(db, "quizzes"),
          where("userId", "==", user.uid),
          where("completed", "==", true),
          orderBy("completedAt", "desc"),
          limit(3)
        );
        
        // Get in-progress quizzes
        const inProgressQuery = query(
          collection(db, "quizzes"),
          where("userId", "==", user.uid),
          where("inProgress", "==", true),
          orderBy("lastUpdated", "desc"),
          limit(2)
        );
        
        const [completedSnapshot, inProgressSnapshot] = await Promise.all([
          getDocs(completedQuery),
          getDocs(inProgressQuery)
        ]);
        
        const completedQuizzes = completedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as QuizData));
        
        const progressQuizzes = inProgressSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as QuizData));
        
        setRecentQuizzes(completedQuizzes);
        setInProgressQuizzes(progressQuizzes);
      } catch (error) {
        console.error("Error fetching user quizzes:", error);
      } finally {
        setDataLoading(false);
      }
    };
    
    if (user && !isLoading) {
      fetchUserQuizzes();
    }
  }, [user, isLoading]);

  // Popular sample quizzes for new users
  const popularQuizzes = [
    {
      id: "sample1",
      title: "Introduction to Biology",
      category: "Science",
      questions: 15,
      difficulty: "Beginner"
    },
    {
      id: "sample2",
      title: "World History Essentials",
      category: "History",
      questions: 20,
      difficulty: "Intermediate"
    },
    {
      id: "sample3",
      title: "Mathematics Fundamentals",
      category: "Math",
      questions: 12,
      difficulty: "Beginner"
    }
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-8 relative overflow-hidden">
      {/* Background graphics */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <svg className="absolute text-muted-foreground/5" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"></path>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)"></rect>
        </svg>
      </div>

      <div className="w-full max-w-5xl pt-16 pb-8">
        <div className="text-center space-y-3 mb-10">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Nidoe
          </h1>
          <p className="text-lg sm:text-xl font-medium text-muted-foreground">
            AI-Powered Study Assistant
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mt-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Transform Your Study Materials Into Interactive Quizzes</h2>
            <p className="text-lg">
              Upload your study materials and let AI generate custom quizzes, 
              summaries, and study guides tailored to your learning needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              {user ? (
                <Link 
                  href="/upload" 
                  className="rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity text-center"
                >
                  <Plus className="h-4 w-4 inline mr-2" />
                  New Quiz
                </Link>
              ) : (
                <Link 
                  href="/upload" 
                  className="rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity text-center"
                >
                  Get Started
                </Link>
              )}
              
              {!user && (
                <Link 
                  href="/login" 
                  className="rounded-xl border px-6 py-3 font-medium shadow-sm hover:bg-accent/50 transition-colors text-center backdrop-blur-sm bg-background/70"
                >
                  Sign In
                </Link>
              )}
              
              {user && inProgressQuizzes.length > 0 && (
                <Link 
                  href={`/quiz/${inProgressQuizzes[0].id}`} 
                  className="rounded-xl border px-6 py-3 font-medium shadow-sm hover:bg-accent/50 transition-colors text-center backdrop-blur-sm bg-background/70"
                >
                  Continue Quiz
                </Link>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {!user && "Try two quizzes for free, no account required."}
            </p>
          </div>
          
          {/* Show quiz types for non-logged in users */}
          {!user && (
            <div className="bg-card rounded-2xl border p-6 shadow-lg relative overflow-hidden">
              <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-primary/5 rounded-full"></div>
              <h3 className="text-xl font-bold mb-6">Multiple Quiz Types</h3>
              <div className="space-y-4">
                <QuizTypeItem 
                  icon={
                    <div className="flex flex-col items-start text-xs space-y-0.5">
                    
                    </div>
                  }
                  title="Multiple Choice" 
                  description="Traditional multiple-choice questions" 
                />
                <QuizTypeItem 
                  icon={<div className="text-primary">?</div>}
                  title="Short Answer" 
                  description="Free text answers with multiple accepted responses" 
                />
                <QuizTypeItem 
                  icon={<div className="text-primary">↔️</div>}
                  title="Matching" 
                  description="Match terms with their definitions" 
                />
                <QuizTypeItem 
                  icon={<div className="text-primary">🧩</div>}
                  title="Puzzle" 
                  description="Multi-step questions that unlock progressively" 
                />
              </div>
            </div>
          )}
          
          {/* Show personalized content for logged-in users instead of quiz types */}
          {user && !isLoading && (
            <div className="bg-card rounded-2xl border p-6 shadow-lg">
              {dataLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-6 w-48 bg-muted rounded"></div>
                  <div className="h-20 bg-muted rounded"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              ) : (
                <>
                  {/* In-progress quizzes */}
                  {inProgressQuizzes.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold mb-3">Continue Learning</h3>
                      <div className="space-y-2">
                        {inProgressQuizzes.map(quiz => (
                          <Link 
                            key={quiz.id} 
                            href={`/quiz/${quiz.id}`}
                            className="flex items-center p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex-1">
                              <h4 className="font-medium line-clamp-1">{quiz.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                Last updated {formatDistanceToNow(new Date(quiz.createdAt))}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Recent quizzes */}
                  {recentQuizzes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-3">Recent Quizzes</h3>
                      <div className="space-y-2">
                        {recentQuizzes.slice(0, 2).map(quiz => (
                          <Link 
                            key={quiz.id} 
                            href={`/summary?quizId=${quiz.id}`}
                            className="flex items-center p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex-1">
                              <h4 className="font-medium line-clamp-1">{quiz.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                Completed {formatDistanceToNow(new Date(quiz.createdAt))}
                              </p>
                            </div>
                            <div className="bg-primary/10 px-2 py-1 rounded text-xs font-medium">
                              Results
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* No quizzes yet */}
                  {inProgressQuizzes.length === 0 && recentQuizzes.length === 0 && (
                    <div className="text-center py-4">
                      <h3 className="text-lg font-bold mb-2">Welcome!</h3>
                      <p className="text-muted-foreground mb-4">Ready to start your learning journey?</p>
                      
                      <div className="mb-6">
                        <h4 className="text-sm font-medium mb-3 text-left">Popular Quizzes</h4>
                        <div className="space-y-2">
                          {popularQuizzes.map(quiz => (
                            <div 
                              key={quiz.id}
                              className="flex items-center p-3 rounded-lg border bg-accent/20"
                            >
                              <div className="flex-1 text-left">
                                <h5 className="font-medium text-sm">{quiz.title}</h5>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10">{quiz.category}</span>
                                  <span className="text-xs text-muted-foreground">{quiz.questions} questions</span>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{quiz.difficulty}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Link 
                        href="/upload" 
                        className="inline-flex items-center justify-center gap-2 p-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create First Quiz</span>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            title="AI-Powered Quizzes"
            description="Generate custom quizzes from your documents, notes, or text"
            icon={<BrainCircuit className="h-6 w-6" />}
          />
          <FeatureCard
            title="Personalized Learning"
            description="Focus on your weak areas with adaptive question selection"
            icon={<BookOpen className="h-6 w-6" />}
          />
          <FeatureCard
            title="Track Progress"
            description="Monitor your learning journey with detailed analytics"
            icon={<BarChart3 className="h-6 w-6" />}
          />
        </div>
      </div>

      <footer className="w-full max-w-5xl border-t py-4 mt-8">
        <p className="text-center text-sm text-muted-foreground">
          @2025 all rights reserved Nidoe powered by <a href="https://nexiloop.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary transition-colors">Nexiloop</a>
        </p>
      </footer>
    </main>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 text-sm">{description}</p>
    </div>
  );
}

function QuizTypeItem({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
} 