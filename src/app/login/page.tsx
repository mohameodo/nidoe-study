"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Mail, LogIn, User } from "lucide-react"
import { auth, googleProvider } from "@/lib/firebase/config"
import { db } from "@/lib/firebase/config"
import { doc, setDoc } from 'firebase/firestore'
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const provider = searchParams.get("provider")
  const [isLogin, setIsLogin] = useState(true)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [freePlaysUsed, setFreePlaysUsed] = useState(0)
  const [user, setUser] = useState<FirebaseUser | null>(null)
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    
    return () => unsubscribe()
  }, [])
  
  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      router.push("/dashboard")
    }
    
    // Check if provider is specified in URL
    if (provider) {
      handleProviderAuth(provider)
    }
    
    // Check local storage for number of free plays used
    const playsUsed = localStorage.getItem('freePlaysUsed')
    if (playsUsed) {
      setFreePlaysUsed(parseInt(playsUsed, 10))
    }
  }, [provider, user, router])
  
  const signInWithGoogle = async () => {
    return signInWithPopup(auth, googleProvider)
  }
  
  const handleProviderAuth = async (provider: string) => {
    setLoading(true)
    setError("")
    
    try {
      if (provider === 'google') {
        await signInWithGoogle()
      } else {
        throw new Error(`Unsupported provider: ${provider}`)
      }
      
      // Redirect is handled in useEffect when user state changes
    } catch (err: any) {
      setError(`${provider} authentication failed: ${err.message}`)
      setLoading(false)
    }
  }
  
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    
    try {
      if (!isLogin) {
        // Validate for sign up
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match")
        }
        
        if (!firstName || !lastName) {
          throw new Error("Please enter your first and last name")
        }
      }
      
      if (email && password) {
        if (isLogin) {
          await signInWithEmailAndPassword(auth, email, password)
        } else {
          // Create user account
          const userCredential = await createUserWithEmailAndPassword(auth, email, password)
          const user = userCredential.user
          
          // Update profile with name
          const fullName = `${firstName} ${lastName}`
          await updateProfile(user, {
            displayName: fullName
          })
          
          // Store additional user data in Firestore
          await setDoc(doc(db, "users", user.uid), {
            firstName,
            lastName,
            email,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          })
        }
        // Redirect is handled in useEffect when user state changes
      } else {
        throw new Error("Please fill in all fields")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication")
      setLoading(false)
    }
  }
  
  // Reset fields when toggling between login and signup
  const toggleLoginMode = () => {
    setIsLogin(!isLogin)
    setError("")
    if (isLogin) {
      setFirstName("")
      setLastName("")
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="bg-card rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            {isLogin ? "Welcome Back" : "Create Your Account"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin
              ? "Sign in to access your personalized dashboard"
              : "Sign up to save your progress and track your learning"}
          </p>
        </div>
        
        {freePlaysUsed < 2 && (
          <div className="bg-muted/50 p-4 rounded-xl mb-6 text-center">
            <p className="text-sm">
              <span className="font-medium">Try without account:</span> You have {2 - freePlaysUsed} free {freePlaysUsed === 1 ? 'quiz' : 'quizzes'} remaining.
            </p>
            <button
              onClick={() => {
                const newCount = freePlaysUsed + 1
                localStorage.setItem('freePlaysUsed', newCount.toString())
                setFreePlaysUsed(newCount)
                router.push('/upload')
              }}
              className="mt-2 text-sm underline hover:text-primary transition-colors"
            >
              Continue as guest
            </button>
          </div>
        )}
        
        {/* Social sign-in options */}
        <div className="flex flex-col gap-3 mb-6">
          <button 
            onClick={() => handleProviderAuth('google')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl border bg-background py-3 font-medium transition-colors hover:bg-accent/50 disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>
        
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {/* Name fields - only shown for signup */}
          {!isLogin && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  First Name
                </label>
                <div className="relative">
                  <input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-xl border bg-background p-3 text-sm"
                    required={!isLogin}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">
                  Last Name
                </label>
                <div className="relative">
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-xl border bg-background p-3 text-sm"
                    required={!isLogin}
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border bg-background p-3 pl-9 text-sm"
                required
              />
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border bg-background p-3 text-sm"
              required
            />
          </div>
          
          {!isLogin && (
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border bg-background p-3 text-sm"
                required
              />
            </div>
          )}
          
          {error && (
            <div className="text-sm text-destructive mt-2">{error}</div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin"></span>
                Processing...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                {isLogin ? "Sign In" : "Create Account"}
              </>
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm">
          {isLogin ? (
            <p>
              Don't have an account?{" "}
              <button
                onClick={toggleLoginMode}
                className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                onClick={toggleLoginMode}
                className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
      
      <div className="mt-4 text-center text-xs text-muted-foreground">
        <p>
          By continuing, you agree to Nidoe's{" "}
          <Link href="/support#terms" className="underline underline-offset-4 hover:text-primary transition-colors">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/support#privacy" className="underline underline-offset-4 hover:text-primary transition-colors">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
} 