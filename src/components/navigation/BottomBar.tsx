"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FileUp, Book, User, BarChart } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/layouts/ClientRootLayout"
import { useTheme } from "next-themes"

type NavItem = {
  name: string
  href: string
  icon: React.ReactNode
  requireAuth?: boolean
}

export default function BottomBar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { theme } = useTheme()
  const [visible, setVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isPWA, setIsPWA] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Check if running in PWA mode (standalone)
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      // Check if the app is running in standalone mode (PWA)
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone 
        || document.referrer.includes('android-app://');
      
      setIsPWA(isInStandaloneMode);
    }
  }, []);

  const navItems: NavItem[] = [
    {
      name: "Home",
      href: "/",
      icon: <Home className="h-5 w-5" />
    },
    {
      name: "Upload",
      href: "/upload",
      icon: <FileUp className="h-5 w-5" />
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <BarChart className="h-5 w-5" />,
      requireAuth: true
    },
    {
      name: "History",
      href: "/history",
      icon: <Book className="h-5 w-5" />,
      requireAuth: true
    },
    {
      name: user ? "Profile" : "Login",
      href: user ? "/profile" : "/login",
      icon: <User className="h-5 w-5" />
    }
  ]

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setVisible(false)
      } else {
        setVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  const filteredItems = navItems.filter(item => !item.requireAuth || user)

  return (
    <div className={cn(
      "md:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300",
      isPWA ? "pb-4" : "pb-0",
      theme === "dark" 
        ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border-t border-border" 
        : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border",
      visible ? "transform-none" : "translate-y-full"
    )}>
      <div className={cn(
        "flex items-center justify-around",
        isPWA ? "p-3 mb-1" : "p-2"
      )}>
        {filteredItems.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center px-2 py-1 rounded-md transition-colors",
                isPWA ? "py-2" : "py-1",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={isPWA ? "mb-1" : ""}>
                {item.icon}
              </div>
              <span className={cn(
                "text-xs",
                isPWA ? "font-medium" : ""
              )}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
} 