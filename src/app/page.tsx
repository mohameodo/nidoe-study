import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-24">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Nidoe
          </h1>
          <p className="text-xl font-semibold text-muted-foreground">
            Smart Study Helper
          </p>
        </div>
        
        <div className="mt-12 space-y-6">
          <p className="text-lg text-center">
            Upload your study materials and let AI generate custom quizzes,
            summaries, and study guides.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            <FeatureCard
              title="AI Quizzes"
              description="Generate custom quizzes from your study materials"
              icon="✨"
            />
            <FeatureCard
              title="Smart Summaries"
              description="Get AI-generated cheat sheets and summaries"
              icon="📝"
            />
            <FeatureCard
              title="Track Progress"
              description="Monitor your learning journey with detailed analytics"
              icon="📊"
            />
          </div>
          
          <div className="flex justify-center mt-12">
            <Link 
              href="/upload" 
              className="rounded-2xl bg-primary px-6 py-3 font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-4">
            Try two quizzes for free, then create an account to save your progress.
          </p>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2">{description}</p>
    </div>
  );
} 