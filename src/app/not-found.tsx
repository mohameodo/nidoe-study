import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold">404</h1>
      <h2 className="mt-4 text-xl font-semibold">Page Not Found</h2>
      <p className="mt-2 text-muted-foreground">
        We couldn't find the page you were looking for.
      </p>
      <div className="mt-8 flex space-x-4">
        <Link
          href="/"
          className="rounded-2xl bg-primary px-6 py-3 font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
        >
          Go Home
        </Link>
        <Link
          href="/upload"
          className="rounded-2xl border bg-background px-6 py-3 font-medium shadow-sm hover:bg-accent/50 transition-all"
        >
          Start Studying
        </Link>
      </div>
      <p className="mt-12 text-sm text-muted-foreground">
        <span className="font-medium">Error 404:</span> Even AI can't find this page 😔
      </p>
    </div>
  )
} 