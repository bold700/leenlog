"use client"

import * as React from "react"
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth"

import { firebaseEnabled, getFirebase } from "@/lib/firebase"

interface AuthValue {
  enabled: boolean
  user: User | null
  loading: boolean
  signInEmail: (email: string, password: string) => Promise<void>
  signUpEmail: (email: string, password: string) => Promise<void>
  signInGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(firebaseEnabled)

  React.useEffect(() => {
    if (!firebaseEnabled) return
    const { auth } = getFirebase()
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const value = React.useMemo<AuthValue>(
    () => ({
      enabled: firebaseEnabled,
      user,
      loading,
      signInEmail: async (email, password) => {
        const { auth } = getFirebase()
        await signInWithEmailAndPassword(auth, email, password)
      },
      signUpEmail: async (email, password) => {
        const { auth } = getFirebase()
        await createUserWithEmailAndPassword(auth, email, password)
      },
      signInGoogle: async () => {
        const { auth, googleProvider } = getFirebase()
        await signInWithPopup(auth, googleProvider)
      },
      signOut: async () => {
        const { auth } = getFirebase()
        await fbSignOut(auth)
      },
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
