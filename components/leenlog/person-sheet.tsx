"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { byId } from "@/lib/leenlog"
import { ConfirmDialog } from "./confirm-dialog"
import { LoanHistoryList } from "./loan-history"
import { useLeenLog } from "./store"

export function PersonSheet({
  personId,
  open,
  onOpenChange,
}: {
  personId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const store = useLeenLog()
  const existing = personId ? byId(store.db.people, personId) : undefined
  const openLoans = personId
    ? store.db.loans.filter((l) => l.personId === personId && !l.actualReturn)
    : []

  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [note, setNote] = React.useState("")
  const [error, setError] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setName(existing?.name ?? "")
      setPhone(existing?.phone ?? "")
      setEmail(existing?.email ?? "")
      setNote(existing?.note ?? "")
      setError(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, personId])

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError(true)
      return
    }
    if (existing) {
      store.updatePerson(existing.id, {
        name: trimmed,
        phone: phone.trim(),
        email: email.trim(),
        note: note.trim(),
      })
      toast.success("Opgeslagen")
    } else {
      const dupe = store.db.people.find(
        (p) => p.name.trim().toLowerCase() === trimmed.toLowerCase()
      )
      if (dupe) {
        toast.info(`"${dupe.name}" bestond al`)
        onOpenChange(false)
        return
      }
      store.addPerson({ name: trimmed, phone: phone.trim(), email: email.trim(), note: note.trim() })
      toast.success("Persoon toegevoegd")
    }
    onOpenChange(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[92vh] max-w-[480px] overflow-y-auto rounded-t-2xl px-5 pb-8"
        >
          <SheetHeader className="px-0">
            <SheetTitle>{existing ? "Persoon bewerken" : "Nieuwe persoon"}</SheetTitle>
            {openLoans.length > 0 && (
              <SheetDescription>
                {openLoans.length} lopende uitlening(en) bij deze persoon.
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="pe-name">Naam</Label>
              <Input
                id="pe-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(false)
                }}
                aria-invalid={error}
                placeholder="bijv. Jeroen de Vries"
              />
              {error && <p className="text-destructive text-xs font-semibold">Vul een naam in.</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pe-phone">Telefoon</Label>
              <Input id="pe-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06…" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pe-email">E-mail</Label>
              <Input id="pe-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="optioneel" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pe-note">Notitie</Label>
              <Input id="pe-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="bijv. buurman, klant" />
            </div>
          </div>

          {existing && (
            <div className="mt-6">
              <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                Heeft geleend
              </p>
              <LoanHistoryList by="personId" id={existing.id} />
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 [&>button]:h-11">
            <Button size="lg" onClick={submit}>Opslaan</Button>
            {existing && (
              <Button
                variant="outline"
                size="lg"
                disabled={openLoans.length > 0}
                onClick={() => setConfirmOpen(true)}
              >
                {openLoans.length > 0 ? "Kan niet verwijderen (lopende leen)" : "Verwijderen"}
              </Button>
            )}
            <Button variant="ghost" size="lg" onClick={() => onOpenChange(false)}>Sluiten</Button>
          </div>
        </SheetContent>
      </Sheet>

      {existing && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={`"${existing.name}" verwijderen?`}
          description="Deze persoon wordt uit je lijst verwijderd."
          onConfirm={() => {
            store.deletePerson(existing.id)
            setConfirmOpen(false)
            onOpenChange(false)
            toast.success("Verwijderd")
          }}
        />
      )}
    </>
  )
}
