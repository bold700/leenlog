"use client"

import { Loader2 } from "lucide-react"

import { AuthProvider, useAuth } from "./auth-provider"
import { FirestoreProvider } from "./firestore-store"
import { LeenLogApp } from "./leenlog-app"
import { LoginView } from "./login-view"
import { LeenLogProvider } from "./store"

function Splash() {
  return (
    <div className="bg-background flex min-h-dvh items-center justify-center">
      <Loader2 className="text-muted-foreground size-6 animate-spin" />
    </div>
  )
}

function Gate() {
  const { enabled, user, loading } = useAuth()

  // Demo-modus: geen Firebase geconfigureerd -> localStorage, geen login.
  if (!enabled) {
    return (
      <LeenLogProvider>
        <LeenLogApp />
      </LeenLogProvider>
    )
  }

  if (loading) return <Splash />
  if (!user) return <LoginView />

  return (
    <FirestoreProvider uid={user.uid}>
      <LeenLogApp />
    </FirestoreProvider>
  )
}

export function AppRoot() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
