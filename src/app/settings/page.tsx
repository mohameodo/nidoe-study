"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, Camera, Save, Trash2, AlertTriangle } from "lucide-react"
import { useAuth } from "@/components/layouts/ClientRootLayout"
import { auth, db, storage } from "@/lib/firebase/config"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { updateProfile } from "firebase/auth"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { ImageUpload } from "@/components/ui/image-upload"

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [quizDifficulty, setQuizDifficulty] = useState("medium")
  const [quizLength, setQuizLength] = useState("10")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])
  
  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return
      
      try {
        // Set profile image from user profile
        if (user.photoURL) {
          setProfileImageUrl(user.photoURL)
        }
        
        // Split display name into first and last name if available
        if (user.displayName) {
          const nameParts = user.displayName.split(" ")
          setFirstName(nameParts[0] || "")
          setLastName(nameParts.slice(1).join(" ") || "")
        }
        
        // Get additional user settings from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setFirstName(userData.firstName || firstName)
          setLastName(userData.lastName || lastName)
          setQuizDifficulty(userData.quizPreferences?.difficulty || "medium")
          setQuizLength(userData.quizPreferences?.length || "10")
        }
      } catch (err) {
        console.error("Error loading user data:", err)
      }
    }
    
    loadUserData()
  }, [user])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setLoading(true)
    setError("")
    setSuccess(false)
    
    try {
      let photoURL = user.photoURL
      
      // Upload new profile image if selected
      if (profileImage) {
        const imageRef = ref(storage, `users/${user.uid}/profile.jpg`)
        await uploadBytes(imageRef, profileImage)
        photoURL = await getDownloadURL(imageRef)
      } else if (profileImageUrl === null && user.photoURL) {
        // Delete existing image if removed
        try {
          const imageRef = ref(storage, `users/${user.uid}/profile.jpg`)
          await deleteObject(imageRef)
        } catch (err) {
          // Ignore errors if file doesn't exist
        }
        photoURL = null
      }
      
      // Update Firebase Auth profile
      const displayName = `${firstName} ${lastName}`.trim()
      await updateProfile(user, {
        displayName,
        photoURL
      })
      
      // Update Firestore user document
      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        email: user.email,
        updatedAt: new Date().toISOString(),
        quizPreferences: {
          difficulty: quizDifficulty,
          length: quizLength
        }
      }, { merge: true })
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <div className="animate-pulse h-6 w-6 rounded-full border-2 border-primary border-r-transparent animate-spin"></div>
      </div>
    )
  }
  
  if (!user) {
    return null
  }
  
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <div className="bg-card rounded-2xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center space-y-4">
              <ImageUpload
                value={profileImageUrl}
                onChange={setProfileImageUrl}
                onFileChange={setProfileImage}
                previewSize={96}
              />
              <p className="text-xs text-muted-foreground">
                Upload a profile picture (JPG, PNG)
              </p>
            </div>
            
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border bg-background p-3 text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border bg-background p-3 text-sm"
                />
              </div>
            </div>
            
            {/* Email (read-only) */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user.email || ""}
                readOnly
                className="w-full rounded-xl border bg-muted/50 p-3 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            
            {/* Quiz Preferences */}
            <div className="space-y-4 pt-4 border-t">
              <h2 className="text-lg font-semibold">Quiz Preferences</h2>
              
              <div className="space-y-2">
                <label htmlFor="difficulty" className="text-sm font-medium">
                  Quiz Difficulty
                </label>
                <select
                  id="difficulty"
                  value={quizDifficulty}
                  onChange={(e) => setQuizDifficulty(e.target.value)}
                  className="w-full rounded-xl border bg-background p-3 text-sm"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Controls the complexity of generated questions
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="length" className="text-sm font-medium">
                  Default Quiz Length
                </label>
                <select
                  id="length"
                  value={quizLength}
                  onChange={(e) => setQuizLength(e.target.value)}
                  className="w-full rounded-xl border bg-background p-3 text-sm"
                >
                  <option value="5">5 questions</option>
                  <option value="10">10 questions</option>
                  <option value="15">15 questions</option>
                  <option value="20">20 questions</option>
                </select>
              </div>
            </div>
            
            {/* Status Messages */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg flex items-center gap-2 text-sm">
                <Save className="h-4 w-4" />
                Settings saved successfully
              </div>
            )}
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-primary py-2 px-4 font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
        {/* Theme Toggle Section */}
        <div className="bg-card rounded-2xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Theme</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm">Switch between light and dark mode</span>
            <ThemeToggle />
          </div>
        </div>
        
        {/* Notification Settings */}
        <div className="bg-card rounded-2xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Quiz Reminders</h3>
                <p className="text-xs text-muted-foreground">Receive notifications about incomplete quizzes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/50"></div>
                <span className="sr-only">Enable quiz reminders</span>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Study Updates</h3>
                <p className="text-xs text-muted-foreground">Get notified about new study features</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/50"></div>
                <span className="sr-only">Enable study updates</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile explanation banner */}
      <div className="md:hidden mt-8 bg-accent/50 rounded-2xl p-6 border text-center">
        <h2 className="text-lg font-semibold mb-3">Transform Your Study Materials Into Interactive Quizzes</h2>
        <p className="text-muted-foreground text-sm">
          Upload your study materials and let AI generate custom quizzes, summaries, 
          and study guides tailored to your learning needs.
        </p>
      </div>
    </div>
  )
} 