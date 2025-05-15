"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "./ui/theme-toggle"
import { Menu, X, User, LogIn } from "lucide-react"
import { useAuth } from "@/components/layouts/ClientRootLayout"

type NavLink = {
  name: string
  href: string
}

const navLinks: NavLink[] = [
  { name: "Home", href: "/" },
  { name: "Upload", href: "/upload" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Explore", href: "/explore" },
  { name: "Support", href: "/support" },
]

export function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, isLoading } = useAuth()

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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all ${
      scrolled ? "shadow-sm" : ""
    }`}>
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">Nidoe</span>
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
                <Link
                  href="/profile"
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
                </Link>
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
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
} 