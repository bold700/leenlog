"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "./auth-provider"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75Z" />
    </svg>
  )
}

// Friendly Dutch messages for the common Firebase auth errors.
function friendlyError(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Dat e-mailadres klopt niet."
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail of wachtwoord onjuist."
    case "auth/email-already-in-use":
      return "Er bestaat al een account met dit e-mailadres."
    case "auth/weak-password":
      return "Kies een wachtwoord van minstens 6 tekens."
    case "auth/popup-closed-by-user":
      return "Inloggen geannuleerd."
    default:
      return "Er ging iets mis. Probeer het opnieuw."
  }
}

export function LoginView() {
  const auth = useAuth()
  const [mode, setMode] = React.useState<"in" | "up">("in")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [busy, setBusy] = React.useState<null | "email" | "google">(null)

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setBusy("email")
    try {
      if (mode === "in") await auth.signInEmail(email.trim(), password)
      else await auth.signUpEmail(email.trim(), password)
    } catch (err) {
      toast.error(friendlyError((err as { code?: string })?.code ?? ""))
    } finally {
      setBusy(null)
    }
  }

  async function google() {
    setBusy("google")
    try {
      await auth.signInGoogle()
    } catch (err) {
      toast.error(friendlyError((err as { code?: string })?.code ?? ""))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="bg-background flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2 text-2xl font-bold tracking-tight">
          <span className="bg-primary size-3 rounded-full" />
          LeenLog
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{mode === "in" ? "Inloggen" : "Account aanmaken"}</CardTitle>
            <CardDescription>
              {mode === "in"
                ? "Log in om je uitleningen overal te zien."
                : "Maak een account, je data staat veilig in de cloud."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button variant="outline" className="h-11" onClick={google} disabled={busy !== null}>
              {busy === "google" ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
              Doorgaan met Google
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-xs">of</span>
              <Separator className="flex-1" />
            </div>

            <form onSubmit={submitEmail} className="flex flex-col gap-3">
              <div className="grid gap-2">
                <Label htmlFor="login-email">E-mail</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="jij@voorbeeld.nl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="login-password">Wachtwoord</Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete={mode === "in" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="h-11" disabled={busy !== null}>
                {busy === "email" && <Loader2 className="size-4 animate-spin" />}
                {mode === "in" ? "Inloggen" : "Account aanmaken"}
              </Button>
            </form>

            <p className="text-muted-foreground text-center text-sm">
              {mode === "in" ? "Nog geen account?" : "Al een account?"}{" "}
              <button
                type="button"
                className="text-primary font-semibold underline-offset-4 hover:underline"
                onClick={() => setMode(mode === "in" ? "up" : "in")}
              >
                {mode === "in" ? "Aanmaken" : "Inloggen"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
