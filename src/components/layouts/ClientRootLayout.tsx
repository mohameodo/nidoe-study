"use client"

import React, { useState, useEffect, createContext, useContext } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';
import { SettingsProvider } from "@/lib/context/settings-context";
import BottomBar from '@/components/navigation/BottomBar';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { usePathname } from 'next/navigation';

// Create a new auth context
type AuthContextType = {
  user: User | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export default function ClientRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  
  // Determine if we're on a quiz page
  const isQuizPage = pathname?.includes('/quiz/') && !pathname?.endsWith('/upload');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthContext.Provider value={{ user, isLoading }}>
        <SettingsProvider>
          {!isQuizPage && <Header />}
          <main className={`flex-1 ${isQuizPage ? 'pb-0' : ''}`}>{children}</main>
          {!isQuizPage && <BottomBar />}
        </SettingsProvider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
} 