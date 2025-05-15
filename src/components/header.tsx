"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "./ui/theme-toggle"
import { Menu, X, User, LogIn, Settings, LayoutDashboard, LogOut } from "lucide-react"
import { useAuth } from "@/components/layouts/ClientRootLayout"
import { auth } from "@/lib/firebase/config"
import { signOut } from "firebase/auth"
import { useTheme } from "next-themes"
import Image from "next/image"

type NavLink = {
  name: string
  href: string
}

const navLinks: NavLink[] = [
  { name: "Home", href: "/" },
  { name: "Upload", href: "/upload" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "History", href: "/history" },
  { name: "Explore", href: "/explore" },
  { name: "Support", href: "/support" },
]

export function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const { user, isLoading } = useAuth()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Set mounted to true once component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }
  
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen)
  }
  
  const handleLogout = async () => {
    try {
      await signOut(auth)
      setIsProfileMenuOpen(false)
    } catch (error) {
      console.error("Error signing out: ", error)
    }
  }

  return (
    <header className={`sticky top-0 z-50 w-full transition-all ${
      scrolled 
        ? "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm" 
        : "bg-transparent"
    }`}>
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            {mounted ? (
              <Image 
                src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"}
                alt="Nidoe Logo"
                width={150}
                height={50}
                priority
                quality={95}
                className="h-10 w-auto"
              />
            ) : (
              <div className="h-10 w-32 bg-muted/20 animate-pulse rounded"></div>
            )}
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
        
        {/* Right side buttons */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {!isLoading && (
            <>
              {user ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={toggleProfileMenu}
                    className="rounded-full border overflow-hidden flex items-center justify-center hover:border-primary transition-colors"
                    title={user.displayName || user.email || "Profile"}
                  >
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="Profile" 
                        className="h-8 w-8 object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                  
                  {/* Profile dropdown menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl border shadow-md py-1 z-50">
                      <div className="px-4 py-2 border-b">
                        <p className="font-medium text-sm truncate">
                          {user.displayName || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          className="flex items-center px-4 py-2 text-sm hover:bg-accent/50 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Dashboard
                        </Link>
                        <Link
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm hover:bg-accent/50 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center px-4 py-2 text-sm hover:bg-accent/50 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Link>
                      </div>
                      
                      <div className="border-t py-1">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1 rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
                >
                  <LogIn className="h-4 w-4 mr-1" />
                  Sign In
                </Link>
              )}
            </>
          )}
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden rounded-full p-2 hover:bg-accent"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation Drawer */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-4">
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`py-2 text-sm font-medium transition-colors hover:text-primary ${
                    pathname === link.href
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              {user && (
                <>
                  <Link
                    href="/profile"
                    className="py-2 text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="py-2 text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="py-2 text-sm font-medium transition-colors hover:text-destructive text-muted-foreground text-left"
                  >
                    Log out
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
} 