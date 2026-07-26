"use client"

import * as React from "react"
import { CalendarClock, Check, Package, Plus, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  activeLoanForItem,
  bruikleenTerms,
  byId,
  DAY,
  euro,
  fmtDate,
  fromDateInput,
  initials,
  startOfToday,
  toDateInput,
} from "@/lib/leenlog"
import { useLeenLog } from "./store"

type Mode = "main" | "add-item" | "add-person"

interface Draft {
  itemId: string | null
  personId: string | null
  concept: boolean
  dateOut: number
  expectedReturn: number
  notes: string
  conditionOut: string
  terms: boolean
}

const PRESETS = [
  { label: "1 week", days: 7 },
  { label: "2 weken", days: 14 },
  { label: "1 maand", days: 30 },
]

function newDraft(): Draft {
  const today = startOfToday()
  return {
    itemId: null,
    personId: null,
    concept: false,
    dateOut: today,
    expectedReturn: today + 7 * DAY,
    notes: "",
    conditionOut: "",
    terms: true,
  }
}

function StepLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground mt-5 mb-2 text-xs font-semibold tracking-wide uppercase first:mt-0">
      {children}
    </p>
  )
}

export function AddLoanSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const store = useLeenLog()
  const [draft, setDraft] = React.useState<Draft>(newDraft)
  const [mode, setMode] = React.useState<Mode>("main")

  React.useEffect(() => {
    if (open) {
      setDraft(newDraft())
      setMode("main")
    }
  }, [open])

  const availableItems = store.db.items.filter((i) => i.status !== "out")
  const outItems = store.db.items.filter((i) => i.status === "out")
  const item = draft.itemId ? byId(store.db.items, draft.itemId) : undefined
  const person = draft.personId ? byId(store.db.people, draft.personId) : undefined
  const canSave = Boolean(draft.itemId && draft.personId)
  const durationDays = Math.max(0, Math.round((draft.expectedReturn - draft.dateOut) / DAY))

  // Bij wie ligt het item nu (voor de concept-waarschuwing)?
  const currentHolder = React.useMemo(() => {
    if (!item || item.status !== "out") return null
    const loan = activeLoanForItem(store.db.loans, item.id)
    if (!loan) return null
    return { person: byId(store.db.people, loan.personId), expectedReturn: loan.expectedReturn }
  }, [item, store.db.loans, store.db.people])

  function pickItem(id: string) {
    const chosen = byId(store.db.items, id)!
    setDraft((d) => {
      const duration = Math.max(1, Math.round((d.expectedReturn - d.dateOut) / DAY)) || 7
      if (chosen.status === "out") {
        const holder = activeLoanForItem(store.db.loans, id)
        const start = holder ? holder.expectedReturn : startOfToday()
        return { ...d, itemId: id, concept: true, dateOut: start, expectedReturn: start + duration * DAY }
      }
      const today = startOfToday()
      return { ...d, itemId: id, concept: false, dateOut: today, expectedReturn: today + duration * DAY }
    })
  }

  function setDuration(days: number) {
    setDraft((d) => ({ ...d, expectedReturn: d.dateOut + days * DAY }))
  }

  function setStart(ts: number) {
    setDraft((d) => ({ ...d, dateOut: ts, expectedReturn: ts + durationDays * DAY }))
  }

  function save() {
    if (!draft.itemId || !draft.personId) return
    store.addLoan({
      itemId: draft.itemId,
      personId: draft.personId,
      dateOut: draft.dateOut,
      expectedReturn: draft.expectedReturn,
      notes: draft.notes,
      concept: draft.concept,
      conditionOut: draft.conditionOut,
      terms: draft.terms,
    })
    const p = byId(store.db.people, draft.personId)
    toast.success(
      draft.concept
        ? `Concept-reservering aangemaakt voor ${p?.name ?? ""}`.trim()
        : `Uitgeleend aan ${p?.name ?? ""}`.trim()
    )
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92vh] max-w-[480px] gap-0 overflow-y-auto rounded-t-2xl px-5 pb-8"
      >
        {mode === "add-item" ? (
          <InlineItemForm
            onCancel={() => setMode("main")}
            onCreate={(id) => {
              pickItem(id)
              setMode("main")
            }}
          />
        ) : mode === "add-person" ? (
          <InlinePersonForm
            onCancel={() => setMode("main")}
            onCreate={(id) => {
              setDraft((d) => ({ ...d, personId: id }))
              setMode("main")
            }}
          />
        ) : (
          <>
            <SheetHeader className="px-0">
              <SheetTitle>Iets uitlenen</SheetTitle>
              <SheetDescription>In een paar tikken vastgelegd.</SheetDescription>
            </SheetHeader>

            <StepLabel>1 · Welk spul</StepLabel>
            {item ? (
              <SelectedRow
                icon={<Package className="size-4" />}
                title={item.name}
                onChange={() => setDraft((d) => ({ ...d, itemId: null, concept: false }))}
              />
            ) : (
              <div className="flex flex-col gap-2">
                {availableItems.map((it) => (
                  <PickerButton
                    key={it.id}
                    onClick={() => pickItem(it.id)}
                    icon={<Package className="size-4" />}
                    title={it.name}
                    subtitle={it.estimatedValue ? euro(it.estimatedValue) : undefined}
                  />
                ))}
                <AddButton onClick={() => setMode("add-item")}>Nieuw spul</AddButton>

                {outItems.length > 0 && (
                  <>
                    <p className="text-muted-foreground mt-3 mb-1 px-1 text-xs font-semibold tracking-wide uppercase">
                      Nu uitgeleend · als concept plannen
                    </p>
                    {outItems.map((it) => {
                      const holder = activeLoanForItem(store.db.loans, it.id)
                      const hp = holder ? byId(store.db.people, holder.personId) : undefined
                      return (
                        <PickerButton
                          key={it.id}
                          onClick={() => pickItem(it.id)}
                          icon={<CalendarClock className="size-4" />}
                          title={it.name}
                          subtitle={
                            holder
                              ? `bij ${hp?.name ?? "?"}, terug ${fmtDate(holder.expectedReturn)}`
                              : "uitgeleend"
                          }
                        />
                      )
                    })}
                  </>
                )}
              </div>
            )}

            {item && draft.concept && (
              <Alert className="mt-3">
                <TriangleAlert />
                <AlertTitle>Dit item is nog niet terug</AlertTitle>
                <AlertDescription>
                  {currentHolder?.person
                    ? `${item.name} ligt nu bij ${currentHolder.person.name} en is verwacht terug op ${fmtDate(
                        currentHolder.expectedReturn
                      )}. Je legt dit vast als concept-reservering vanaf de startdatum hieronder.`
                    : "Je legt dit vast als concept-reservering. Activeer het pas als het item terug is."}
                </AlertDescription>
              </Alert>
            )}

            <StepLabel>2 · Wie leent het</StepLabel>
            {person ? (
              <SelectedRow
                icon={<AvatarFallback className="text-[11px]">{initials(person.name)}</AvatarFallback>}
                title={person.name}
                onChange={() => setDraft((d) => ({ ...d, personId: null }))}
                isAvatar
              />
            ) : (
              <div className="flex flex-col gap-2">
                {store.db.people.map((p) => (
                  <PickerButton
                    key={p.id}
                    onClick={() => setDraft((d) => ({ ...d, personId: p.id }))}
                    avatar={initials(p.name)}
                    title={p.name}
                    subtitle={p.note || undefined}
                  />
                ))}
                <AddButton onClick={() => setMode("add-person")}>Nieuwe persoon</AddButton>
              </div>
            )}

            {draft.concept && (
              <>
                <StepLabel>3 · Vanaf (startdatum)</StepLabel>
                <Input
                  type="date"
                  aria-label="Startdatum"
                  value={toDateInput(draft.dateOut)}
                  onChange={(e) => e.target.value && setStart(fromDateInput(e.target.value))}
                />
              </>
            )}

            <StepLabel>{draft.concept ? "4 · Verwacht terug" : "3 · Verwacht terug"}</StepLabel>
            <div className="mb-2 flex flex-wrap gap-2">
              {PRESETS.map((preset) => {
                const activeChip = durationDays === preset.days
                return (
                  <button
                    key={preset.days}
                    type="button"
                    aria-pressed={activeChip}
                    onClick={() => setDuration(preset.days)}
                    className={cn(
                      "focus-visible:ring-ring inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
                      activeChip
                        ? "bg-primary text-primary-foreground border-transparent"
                        : "bg-secondary text-secondary-foreground hover:bg-muted border-border"
                    )}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
            <Input
              type="date"
              aria-label="Verwachte retourdatum"
              min={toDateInput(draft.dateOut)}
              value={toDateInput(draft.expectedReturn)}
              onChange={(e) =>
                e.target.value &&
                setDraft((d) => ({ ...d, expectedReturn: fromDateInput(e.target.value) }))
              }
            />
            <p className="text-muted-foreground mt-1.5 text-xs">
              {durationDays > 0
                ? `Uitleenperiode: ${durationDays} ${durationDays === 1 ? "dag" : "dagen"} · terug op ${fmtDate(
                    draft.expectedReturn
                  )}`
                : "Kies een terugdatum na de startdatum."}
            </p>

            {!draft.concept && (
              <div className="mt-4 grid gap-2">
                <Label htmlFor="loan-condition">Staat bij uitgifte (optioneel)</Label>
                <Input
                  id="loan-condition"
                  placeholder="bijv. lichte kras op zijkant, verder gaaf"
                  value={draft.conditionOut}
                  onChange={(e) => setDraft((d) => ({ ...d, conditionOut: e.target.value }))}
                />
                <p className="text-muted-foreground text-xs">Handig als bewijs bij schadediscussies.</p>
              </div>
            )}

            <div className="mt-4 grid gap-2">
              <Label htmlFor="loan-notes">Notitie (optioneel)</Label>
              <Input
                id="loan-notes"
                placeholder="bijv. voor de verbouwing"
                value={draft.notes}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              />
            </div>

            <div className="bg-muted/40 mt-4 rounded-xl border p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label htmlFor="loan-terms" className="font-semibold">Bruikleen-voorwaarden meesturen</Label>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Komen mee in de leenbevestiging via WhatsApp.
                  </p>
                </div>
                <Switch
                  id="loan-terms"
                  checked={draft.terms}
                  onCheckedChange={(v) => setDraft((d) => ({ ...d, terms: v }))}
                />
              </div>
              {draft.terms && item && (
                <ul className="text-muted-foreground mt-3 space-y-1 border-t pt-3 text-xs">
                  {bruikleenTerms(item).map((t, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="text-primary">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2 [&>a]:h-11 [&>button]:h-11">
              <Button size="lg" disabled={!canSave} onClick={save}>
                <Check className="size-4" /> {draft.concept ? "Concept vastleggen" : "Uitlenen"}
              </Button>
              <Button variant="ghost" size="lg" onClick={() => onOpenChange(false)}>
                Annuleren
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function SelectedRow({
  icon,
  title,
  onChange,
  isAvatar,
}: {
  icon: React.ReactNode
  title: string
  onChange: () => void
  isAvatar?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="border-primary bg-primary/5 focus-visible:ring-ring flex min-h-12 w-full items-center gap-3 rounded-lg border px-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      {isAvatar ? (
        <Avatar className="size-9 rounded-lg">{icon}</Avatar>
      ) : (
        <span className="bg-muted text-muted-foreground grid size-9 place-items-center rounded-lg">
          {icon}
        </span>
      )}
      <span className="flex-1 font-semibold">{title}</span>
      <span className="text-primary text-sm font-semibold">Wijzig</span>
    </button>
  )
}

function PickerButton({
  onClick,
  icon,
  avatar,
  title,
  subtitle,
}: {
  onClick: () => void
  icon?: React.ReactNode
  avatar?: string
  title: string
  subtitle?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-secondary hover:bg-muted focus-visible:ring-ring border-border flex min-h-12 w-full items-center gap-3 rounded-lg border px-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      {avatar ? (
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg text-[11px]">{avatar}</AvatarFallback>
        </Avatar>
      ) : (
        <span className="bg-background text-muted-foreground grid size-8 place-items-center rounded-lg">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{title}</span>
        {subtitle && (
          <span className="text-muted-foreground block truncate text-sm">{subtitle}</span>
        )}
      </span>
    </button>
  )
}

function AddButton({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-primary border-border hover:bg-muted focus-visible:ring-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <Plus className="size-4" /> {children}
    </button>
  )
}

function InlineItemForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void
  onCreate: (id: string) => void
}) {
  const store = useLeenLog()
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [value, setValue] = React.useState("")
  const [error, setError] = React.useState(false)

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError(true)
      return
    }
    const dupe = store.db.items.find(
      (i) => i.name.trim().toLowerCase() === trimmed.toLowerCase()
    )
    if (dupe) {
      toast.info(`"${dupe.name}" bestond al, geselecteerd`)
      onCreate(dupe.id)
      return
    }
    const it = store.addItem({
      name: trimmed,
      description,
      estimatedValue: value ? Number(value) : null,
    })
    toast.success("Spul toegevoegd")
    onCreate(it.id)
  }

  return (
    <>
      <SheetHeader className="px-0">
        <SheetTitle>Nieuw spul</SheetTitle>
      </SheetHeader>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="qi-name">Naam</Label>
          <Input
            id="qi-name"
            autoFocus
            placeholder="bijv. Bosch boormachine"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(false)
            }}
            aria-invalid={error}
          />
          {error && <p className="text-destructive text-xs font-semibold">Vul een naam in.</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="qi-desc">Omschrijving</Label>
          <Input id="qi-desc" placeholder="optioneel" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="qi-val">Geschatte waarde (€)</Label>
          <Input id="qi-val" type="number" inputMode="numeric" placeholder="optioneel" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-2 [&>button]:h-11">
        <Button size="lg" onClick={submit}>Toevoegen</Button>
        <Button variant="ghost" size="lg" onClick={onCancel}>Terug</Button>
      </div>
    </>
  )
}

function InlinePersonForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void
  onCreate: (id: string) => void
}) {
  const store = useLeenLog()
  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [note, setNote] = React.useState("")
  const [error, setError] = React.useState(false)

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError(true)
      return
    }
    const dupe = store.db.people.find(
      (p) => p.name.trim().toLowerCase() === trimmed.toLowerCase()
    )
    if (dupe) {
      toast.info(`"${dupe.name}" bestond al, geselecteerd`)
      onCreate(dupe.id)
      return
    }
    const p = store.addPerson({
      name: trimmed,
      phone: phone.trim(),
      email: email.trim(),
      note: note.trim(),
    })
    toast.success("Persoon toegevoegd")
    onCreate(p.id)
  }

  return (
    <>
      <SheetHeader className="px-0">
        <SheetTitle>Nieuwe persoon</SheetTitle>
      </SheetHeader>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="qp-name">Naam</Label>
          <Input
            id="qp-name"
            autoFocus
            placeholder="bijv. Jeroen de Vries"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(false)
            }}
            aria-invalid={error}
          />
          {error && <p className="text-destructive text-xs font-semibold">Vul een naam in.</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="qp-phone">Telefoon</Label>
          <Input id="qp-phone" type="tel" inputMode="tel" placeholder="06… (voor WhatsApp-reminder)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <p className="text-muted-foreground text-xs">Met telefoon kun je later met één tik een WhatsApp-reminder sturen.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="qp-email">E-mail</Label>
          <Input id="qp-email" type="email" placeholder="optioneel" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="qp-note">Notitie</Label>
          <Input id="qp-note" placeholder="bijv. buurman, klant" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-2 [&>button]:h-11">
        <Button size="lg" onClick={submit}>Toevoegen</Button>
        <Button variant="ghost" size="lg" onClick={onCancel}>Terug</Button>
      </div>
    </>
  )
}
