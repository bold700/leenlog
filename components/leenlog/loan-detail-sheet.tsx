"use client"

import * as React from "react"
import {
  CalendarClock,
  Check,
  MessageCircle,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  activeLoanForItem,
  byId,
  confirmationMessage,
  euro,
  fmtDate,
  loanStatus,
  normalizePhone,
  returnInfo,
  waLink,
  whatsappLink,
} from "@/lib/leenlog"
import { cn } from "@/lib/utils"
import { ConfirmDialog } from "./confirm-dialog"
import { useLeenLog } from "./store"

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="border-border flex items-center justify-between gap-4 border-b py-3 last:border-b-0">
      <span className="text-muted-foreground text-sm">{k}</span>
      <span className="text-right font-semibold">{v}</span>
    </div>
  )
}

export function LoanDetailSheet({
  loanId,
  open,
  onOpenChange,
}: {
  loanId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const store = useLeenLog()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [returning, setReturning] = React.useState(false)
  const [conditionIn, setConditionIn] = React.useState("")

  const loan = loanId ? byId(store.db.loans, loanId) : undefined
  const item = loan ? byId(store.db.items, loan.itemId) : undefined
  const person = loan ? byId(store.db.people, loan.personId) : undefined

  React.useEffect(() => {
    if (open) {
      setReturning(false)
      setConditionIn("")
    }
  }, [open, loanId])

  if (!loan || !item || !person) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="mx-auto max-w-[480px] rounded-t-2xl px-5 pb-8" />
      </Sheet>
    )
  }

  const st = loanStatus(loan)
  const returned = Boolean(loan.actualReturn)
  const concept = st === "concept"
  const info = returnInfo(loan)
  const hasPhone = Boolean(normalizePhone(person.phone))
  const confirmed = Boolean(loan.confirmedAt)

  const reminderLink = whatsappLink(person, item.name)
  const confirmationLink = waLink(person, confirmationMessage(item, person, loan))

  // Voor een concept: ligt het item nu nog bij iemand anders?
  const blocker = concept ? activeLoanForItem(store.db.loans, item.id) : undefined
  const blockerPerson = blocker ? byId(store.db.people, blocker.personId) : undefined
  const itemAvailable = item.status !== "out"

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[92vh] max-w-[480px] overflow-y-auto rounded-t-2xl px-5 pb-8"
        >
          <SheetHeader className="flex-row items-center justify-between gap-3 px-0">
            <SheetTitle className="text-xl">{item.name}</SheetTitle>
            {returned ? (
              <Badge variant="secondary" className="bg-primary/10 text-primary">Retour</Badge>
            ) : concept ? (
              <Badge variant="outline">Concept</Badge>
            ) : st === "overdue" ? (
              <Badge variant="destructive">{info.text}</Badge>
            ) : (
              <Badge variant="secondary">{info.text}</Badge>
            )}
          </SheetHeader>

          {concept && (
            <Alert className="mb-3">
              <TriangleAlert />
              <AlertTitle>{blocker ? "Item is nog niet terug" : "Concept-reservering"}</AlertTitle>
              <AlertDescription>
                {blocker
                  ? `${item.name} ligt nu bij ${blockerPerson?.name ?? "iemand anders"} en is verwacht terug op ${fmtDate(
                      blocker.expectedReturn
                    )}. Activeer deze reservering zodra het item binnen is.`
                  : "Deze uitlening is nog niet gestart. Activeer 'm wanneer je het item meegeeft."}
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-card border-border rounded-xl border px-4">
            <KV k={concept ? "Gereserveerd voor" : "Geleend aan"} v={person.name} />
            <KV k={concept ? "Gepland vanaf" : "Uitgeleend op"} v={fmtDate(loan.dateOut)} />
            <KV k="Verwacht terug" v={fmtDate(loan.expectedReturn)} />
            {returned && loan.actualReturn && (
              <KV k="Teruggebracht op" v={fmtDate(loan.actualReturn)} />
            )}
            {item.estimatedValue != null && (
              <KV k="Geschatte waarde" v={euro(item.estimatedValue)} />
            )}
            {loan.conditionOut && <KV k="Staat bij uitgifte" v={loan.conditionOut} />}
            {returned && loan.conditionIn && <KV k="Staat bij retour" v={loan.conditionIn} />}
            {!concept && (
              <KV
                k="Bevestiging"
                v={
                  confirmed ? (
                    <span className="text-primary inline-flex items-center gap-1">
                      <ShieldCheck className="size-4" /> Bevestigd op {fmtDate(loan.confirmedAt!)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Nog niet bevestigd</span>
                  )
                }
              />
            )}
            {loan.notes && <KV k="Notitie" v={loan.notes} />}
          </div>

          <div className="mt-5 flex flex-col gap-2 [&>a]:h-11 [&>button]:h-11">
            {concept ? (
              <Button
                size="lg"
                disabled={!itemAvailable}
                onClick={() => {
                  store.activateLoan(loan.id)
                  toast.success(`${item.name} nu uitgeleend aan ${person.name}`)
                  onOpenChange(false)
                }}
              >
                <CalendarClock className="size-4" />
                {itemAvailable ? "Nu uitlenen (activeren)" : "Wacht tot item terug is"}
              </Button>
            ) : returning ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="cond-in">Staat bij retour (optioneel)</Label>
                <Input
                  id="cond-in"
                  autoFocus
                  placeholder="bijv. netjes terug, geen schade"
                  value={conditionIn}
                  onChange={(e) => setConditionIn(e.target.value)}
                />
                <Button
                  size="lg"
                  className="h-11"
                  onClick={() => {
                    store.markReturned(loan.id, conditionIn)
                    toast.success(`${item.name} weer beschikbaar`)
                    onOpenChange(false)
                  }}
                >
                  <Check className="size-4" /> Retour bevestigen
                </Button>
                <Button variant="ghost" size="lg" className="h-11" onClick={() => setReturning(false)}>
                  Annuleren
                </Button>
              </div>
            ) : (
              <>
                {!returned && !confirmed && confirmationLink && (
                  // WhatsApp brand colour, intentional exception to the token palette.
                  <a
                    href={confirmationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "h-11 bg-[#25d366] text-[#04310f] hover:bg-[#1eb85a]"
                    )}
                  >
                    <MessageCircle className="size-4" /> Leenbevestiging sturen
                  </a>
                )}
                {!returned && !confirmed && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      store.confirmLoan(loan.id)
                      toast.success("Gemarkeerd als bevestigd")
                    }}
                  >
                    <ShieldCheck className="size-4" /> Markeer als bevestigd
                  </Button>
                )}
                {!returned && confirmed && reminderLink && (
                  <a
                    href={reminderLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "h-11 bg-[#25d366] text-[#04310f] hover:bg-[#1eb85a]"
                    )}
                  >
                    <MessageCircle className="size-4" />
                    {st === "overdue" ? "WhatsApp-reminder sturen" : "Berichtje sturen"}
                  </a>
                )}
                {!returned && !hasPhone && (
                  <p className="text-muted-foreground text-center text-xs">
                    Geen telefoonnummer bekend voor WhatsApp.
                  </p>
                )}
                {!returned && (
                  <Button size="lg" onClick={() => setReturning(true)}>
                    <Check className="size-4" /> Terug ontvangen
                  </Button>
                )}
              </>
            )}
            {!returning && (
              <>
                <Button variant="outline" size="lg" onClick={() => setConfirmOpen(true)}>
                  <Trash2 className="size-4" /> {concept ? "Reservering verwijderen" : "Uitlening verwijderen"}
                </Button>
                <Button variant="ghost" size="lg" onClick={() => onOpenChange(false)}>
                  Sluiten
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={concept ? "Reservering verwijderen?" : "Uitlening verwijderen?"}
        description="Dit wordt definitief verwijderd. Dit kan niet ongedaan worden gemaakt."
        onConfirm={() => {
          store.deleteLoan(loan.id)
          setConfirmOpen(false)
          onOpenChange(false)
          toast.success(concept ? "Reservering verwijderd" : "Uitlening verwijderd")
        }}
      />
    </>
  )
}
