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

export function ItemSheet({
  itemId,
  open,
  onOpenChange,
}: {
  itemId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const store = useLeenLog()
  const existing = itemId ? byId(store.db.items, itemId) : undefined
  const activeLoan = itemId
    ? store.db.loans.find((l) => l.itemId === itemId && !l.actualReturn)
    : undefined

  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [value, setValue] = React.useState("")
  const [error, setError] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setName(existing?.name ?? "")
      setDescription(existing?.description ?? "")
      setValue(existing?.estimatedValue != null ? String(existing.estimatedValue) : "")
      setError(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, itemId])

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError(true)
      return
    }
    const estimatedValue = value ? Number(value) : null
    if (existing) {
      store.updateItem(existing.id, { name: trimmed, description: description.trim(), estimatedValue })
      toast.success("Opgeslagen")
    } else {
      const dupe = store.db.items.find(
        (i) => i.name.trim().toLowerCase() === trimmed.toLowerCase()
      )
      if (dupe) {
        toast.info(`"${dupe.name}" bestond al`)
        onOpenChange(false)
        return
      }
      store.addItem({ name: trimmed, description, estimatedValue })
      toast.success("Spul toegevoegd")
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
            <SheetTitle>{existing ? "Spul bewerken" : "Nieuw spul"}</SheetTitle>
            {activeLoan && (
              <SheetDescription>
                Nu uitgeleend aan {byId(store.db.people, activeLoan.personId)?.name ?? "?"}.
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="it-name">Naam</Label>
              <Input
                id="it-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(false)
                }}
                aria-invalid={error}
                placeholder="bijv. Bosch boormachine"
              />
              {error && <p className="text-destructive text-xs font-semibold">Vul een naam in.</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="it-desc">Omschrijving</Label>
              <Input id="it-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="optioneel" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="it-val">Geschatte waarde (€)</Label>
              <Input id="it-val" type="number" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} placeholder="optioneel" />
            </div>
          </div>

          {existing && (
            <div className="mt-6">
              <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                Uitleengeschiedenis
              </p>
              <LoanHistoryList by="itemId" id={existing.id} />
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 [&>button]:h-11">
            <Button size="lg" onClick={submit}>Opslaan</Button>
            {existing && (
              <Button
                variant="outline"
                size="lg"
                disabled={Boolean(activeLoan)}
                onClick={() => setConfirmOpen(true)}
              >
                {activeLoan ? "Kan niet verwijderen (uitgeleend)" : "Verwijderen"}
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
          description="Dit spul wordt uit je lijst verwijderd."
          onConfirm={() => {
            store.deleteItem(existing.id)
            setConfirmOpen(false)
            onOpenChange(false)
            toast.success("Verwijderd")
          }}
        />
      )}
    </>
  )
}
