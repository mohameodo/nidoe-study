import Link from 'next/link';
import { Pencil, BookOpen, BrainCircuit, BarChart3 } from 'lucide-react';

export default function Home() {
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
        
        {/* Floating pencil icons */}
        <div className="absolute left-[10%] top-[20%] animate-float-slow">
          <Pencil className="h-12 w-12 text-primary/10 rotate-12" />
        </div>
        <div className="absolute right-[15%] top-[30%] animate-float">
          <Pencil className="h-8 w-8 text-primary/15 -rotate-12" />
        </div>
        <div className="absolute left-[20%] bottom-[25%] animate-float-slow">
          <BookOpen className="h-10 w-10 text-primary/10" />
        </div>
      </div>

      <div className="w-full max-w-6xl pt-20 pb-12">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Nidoe
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-muted-foreground">
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
              <Link 
                href="/upload" 
                className="rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity text-center"
              >
                Get Started
              </Link>
              <Link 
                href="/login" 
                className="rounded-xl border px-6 py-3 font-medium shadow-sm hover:bg-accent/50 transition-colors text-center"
              >
                Sign In
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Try two quizzes for free, no account required.
            </p>
          </div>
          
          <div className="bg-card rounded-2xl border p-6 shadow-lg relative overflow-hidden">
            <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-primary/5 rounded-full"></div>
            <h3 className="text-xl font-bold mb-6">Multiple Quiz Types</h3>
            <div className="space-y-4">
              <QuizTypeItem 
                icon={<div className="text-primary">A B C</div>}
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

      <footer className="w-full max-w-6xl border-t py-6 mt-12">
        <p className="text-center text-sm text-muted-foreground">
          Nidoe - Modern study application powered by AI
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