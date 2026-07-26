"use client"

import * as React from "react"
import {
  Boxes,
  ClipboardList,
  History,
  Package,
  Plus,
  RotateCcw,
  Search,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import type { Loan, Tab } from "@/lib/types"
import {
  byId,
  euro,
  fmtDate,
  initials,
  loanStatus,
  returnInfo,
} from "@/lib/leenlog"
import { useLeenLog } from "./store"
import { AddLoanSheet } from "./add-loan-sheet"
import { LoanDetailSheet } from "./loan-detail-sheet"
import { ItemSheet } from "./item-sheet"
import { PersonSheet } from "./person-sheet"

const TABS: { id: Tab; label: string; icon: React.ElementType; sub: string }[] = [
  { id: "loans", label: "Uitleningen", icon: ClipboardList, sub: "Wie heeft wat van je geleend?" },
  { id: "items", label: "Spullen", icon: Boxes, sub: "Jouw spullen en hun status" },
  { id: "people", label: "Personen", icon: Users, sub: "Vaste leners, één keer invoeren" },
  { id: "history", label: "Historie", icon: History, sub: "Alles wat weer terug is" },
]

export function LeenLogApp() {
  const store = useLeenLog()
  const [tab, setTab] = React.useState<Tab>("loans")
  const [addLoanOpen, setAddLoanOpen] = React.useState(false)
  const [detailLoanId, setDetailLoanId] = React.useState<string | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [itemSheet, setItemSheet] = React.useState<{ open: boolean; id: string | null }>({ open: false, id: null })
  const [personSheet, setPersonSheet] = React.useState<{ open: boolean; id: string | null }>({ open: false, id: null })

  const active = TABS.find((t) => t.id === tab)!

  function openLoan(id: string) {
    setDetailLoanId(id)
    setDetailOpen(true)
  }

  const headerAction =
    tab === "items"
      ? { label: "Nieuw spul", onClick: () => setItemSheet({ open: true, id: null }) }
      : tab === "people"
        ? { label: "Nieuwe persoon", onClick: () => setPersonSheet({ open: true, id: null }) }
        : tab === "history"
          ? null
          : { label: "Nieuwe uitlening", onClick: () => setAddLoanOpen(true) }

  return (
    <SidebarProvider>
      <AppSidebar tab={tab} onSelect={setTab} onReset={() => store.reset()} />

      <SidebarInset>
        <header className="bg-background/85 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur-md md:px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-1 !h-5" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold tracking-tight">{active.label}</h1>
          </div>
          {headerAction && (
            <Button size="sm" onClick={headerAction.onClick}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">{headerAction.label}</span>
            </Button>
          )}
        </header>

        <div className="w-full px-4 py-5 md:px-6 md:py-6">
          <p className="text-muted-foreground -mt-1 mb-5 hidden text-sm md:block">{active.sub}</p>

          {!store.ready ? (
            <div className="text-muted-foreground py-16 text-center text-sm">Laden…</div>
          ) : tab === "loans" ? (
            <LoansView onOpen={openLoan} onNew={() => setAddLoanOpen(true)} />
          ) : tab === "items" ? (
            <ItemsView
              onNew={() => setItemSheet({ open: true, id: null })}
              onOpen={(id) => setItemSheet({ open: true, id })}
            />
          ) : tab === "people" ? (
            <PeopleView
              onNew={() => setPersonSheet({ open: true, id: null })}
              onOpen={(id) => setPersonSheet({ open: true, id })}
            />
          ) : (
            <HistoryView onOpen={openLoan} />
          )}
        </div>
      </SidebarInset>

      {/* Sheets */}
      <AddLoanSheet open={addLoanOpen} onOpenChange={setAddLoanOpen} />
      <LoanDetailSheet loanId={detailLoanId} open={detailOpen} onOpenChange={setDetailOpen} />
      <ItemSheet
        itemId={itemSheet.id}
        open={itemSheet.open}
        onOpenChange={(open) => setItemSheet((s) => ({ ...s, open }))}
      />
      <PersonSheet
        personId={personSheet.id}
        open={personSheet.open}
        onOpenChange={(open) => setPersonSheet((s) => ({ ...s, open }))}
      />
    </SidebarProvider>
  )
}

function AppSidebar({
  tab,
  onSelect,
  onReset,
}: {
  tab: Tab
  onSelect: (t: Tab) => void
  onReset: () => void
}) {
  const { isMobile, setOpenMobile } = useSidebar()

  function go(t: Tab) {
    onSelect(t)
    // Op mobiel: meteen navigeren én het uitschuifpaneel sluiten.
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5 text-lg font-bold tracking-tight">
          <span className="bg-primary size-2.5 rounded-full" />
          LeenLog
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {TABS.map((t) => {
                const Icon = t.icon
                return (
                  <SidebarMenuItem key={t.id}>
                    <SidebarMenuButton
                      isActive={t.id === tab}
                      tooltip={t.label}
                      onClick={() => go(t.id)}
                    >
                      <Icon />
                      <span>{t.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Voorbeelddata resetten" onClick={onReset}>
              <RotateCcw />
              <span>Voorbeelddata resetten</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

function SectionLabel({ children, tone }: { children: React.ReactNode; tone?: "danger" }) {
  return (
    <p
      className={cn(
        "mb-2 mt-6 px-1 text-xs font-semibold tracking-wide uppercase first:mt-0",
        tone === "danger" ? "text-destructive" : "text-muted-foreground"
      )}
    >
      {children}
    </p>
  )
}

function RowGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">{children}</div>
}

function RowItem({
  onClick,
  media,
  danger,
  title,
  meta,
  action,
}: {
  onClick: () => void
  media: React.ReactNode
  danger?: boolean
  title: string
  meta: string
  action?: React.ReactNode
}) {
  return (
    <Item
      variant="outline"
      render={<button type="button" onClick={onClick} />}
      className={cn(
        "hover:bg-accent w-full cursor-pointer shadow-sm transition-[background-color,transform] active:scale-[.99]",
        danger && "border-destructive/50"
      )}
    >
      {media}
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription className="line-clamp-1">{meta}</ItemDescription>
      </ItemContent>
      {action && <ItemActions>{action}</ItemActions>}
    </Item>
  )
}

function AvatarMedia({ text, danger }: { text: string; danger?: boolean }) {
  return (
    <ItemMedia>
      <Avatar className={cn("size-10 rounded-xl", danger && "bg-destructive/10")}>
        <AvatarFallback
          className={cn("rounded-xl text-sm font-semibold", danger && "bg-destructive/10 text-destructive")}
        >
          {text}
        </AvatarFallback>
      </Avatar>
    </ItemMedia>
  )
}

function IconMedia({ children }: { children: React.ReactNode }) {
  return (
    <ItemMedia variant="icon" className="bg-muted text-muted-foreground size-10 rounded-xl">
      {children}
    </ItemMedia>
  )
}

function LoanRow({ loan, onOpen }: { loan: Loan; onOpen: (id: string) => void }) {
  const store = useLeenLog()
  const item = byId(store.db.items, loan.itemId)
  const person = byId(store.db.people, loan.personId)
  const overdue = loanStatus(loan) === "overdue"
  const info = returnInfo(loan)
  return (
    <RowItem
      onClick={() => onOpen(loan.id)}
      media={<AvatarMedia text={initials(person?.name ?? "?")} danger={overdue} />}
      danger={overdue}
      title={item?.name ?? "Onbekend"}
      meta={`${person?.name ?? "?"} · terug ${fmtDate(loan.expectedReturn)}`}
      action={
        <Badge variant={info.tone === "overdue" ? "destructive" : info.tone === "soon" ? "secondary" : "outline"}>
          {info.text}
        </Badge>
      }
    />
  )
}

function LoansView({ onOpen, onNew }: { onOpen: (id: string) => void; onNew: () => void }) {
  const store = useLeenLog()
  const activeLoans = store.db.loans.filter((l) => !l.actualReturn)

  if (activeLoans.length === 0) {
    return (
      <Empty className="py-14">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ClipboardList />
          </EmptyMedia>
          <EmptyTitle>Nog niks uitgeleend</EmptyTitle>
          <EmptyDescription>
            Zodra je iets uitleent zie je het hier, met de te-late items bovenaan.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={onNew}>
            <Plus className="size-4" /> Iets uitlenen
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  const overdue = activeLoans
    .filter((l) => loanStatus(l) === "overdue")
    .sort((a, b) => a.expectedReturn - b.expectedReturn)
  const running = activeLoans
    .filter((l) => loanStatus(l) === "out")
    .sort((a, b) => a.expectedReturn - b.expectedReturn)
  const concepts = activeLoans
    .filter((l) => loanStatus(l) === "concept")
    .sort((a, b) => a.dateOut - b.dateOut)

  return (
    <div>
      {overdue.length > 0 && (
        <>
          <SectionLabel tone="danger">Te laat ({overdue.length})</SectionLabel>
          <RowGrid>
            {overdue.map((l) => (
              <LoanRow key={l.id} loan={l} onOpen={onOpen} />
            ))}
          </RowGrid>
        </>
      )}
      {running.length > 0 && (
        <>
          <SectionLabel>Lopend ({running.length})</SectionLabel>
          <RowGrid>
            {running.map((l) => (
              <LoanRow key={l.id} loan={l} onOpen={onOpen} />
            ))}
          </RowGrid>
        </>
      )}
      {concepts.length > 0 && (
        <>
          <SectionLabel>Concept / gepland ({concepts.length})</SectionLabel>
          <RowGrid>
            {concepts.map((l) => (
              <LoanRow key={l.id} loan={l} onOpen={onOpen} />
            ))}
          </RowGrid>
        </>
      )}
    </div>
  )
}

function ItemsView({ onNew, onOpen }: { onNew: () => void; onOpen: (id: string) => void }) {
  const store = useLeenLog()
  if (store.db.items.length === 0) {
    return (
      <Empty className="py-14">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Boxes />
          </EmptyMedia>
          <EmptyTitle>Geen spullen</EmptyTitle>
          <EmptyDescription>Voeg je eerste spullen toe die je uitleent.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={onNew}>
            <Plus className="size-4" /> Spullen toevoegen
          </Button>
        </EmptyContent>
      </Empty>
    )
  }
  const sorted = [...store.db.items].sort((a, b) => a.name.localeCompare(b.name, "nl"))
  return (
    <RowGrid>
      {sorted.map((it) => (
        <RowItem
          key={it.id}
          onClick={() => onOpen(it.id)}
          media={
            <IconMedia>
              <Package className="size-5" />
            </IconMedia>
          }
          title={it.name}
          meta={`${it.description ? it.description + " · " : ""}${euro(it.estimatedValue) || "geen waarde"}`}
          action={
            it.status === "out" ? (
              <Badge variant="destructive">Uitgeleend</Badge>
            ) : (
              <Badge variant="secondary" className="bg-primary/10 text-primary">Beschikbaar</Badge>
            )
          }
        />
      ))}
    </RowGrid>
  )
}

function PeopleView({ onOpen }: { onNew: () => void; onOpen: (id: string) => void }) {
  const store = useLeenLog()
  if (store.db.people.length === 0) {
    return (
      <Empty className="py-14">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users />
          </EmptyMedia>
          <EmptyTitle>Geen personen</EmptyTitle>
          <EmptyDescription>
            Voeg leners toe, dan hoef je hun gegevens nooit meer over te typen.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }
  const sorted = [...store.db.people].sort((a, b) => a.name.localeCompare(b.name, "nl"))
  return (
    <RowGrid>
      {sorted.map((p) => {
        const open = store.db.loans.filter((l) => l.personId === p.id && !l.actualReturn).length
        return (
          <RowItem
            key={p.id}
            onClick={() => onOpen(p.id)}
            media={<AvatarMedia text={initials(p.name)} />}
            title={p.name}
            meta={`${p.note ? p.note + " · " : ""}${p.phone || "geen telefoon"}`}
            action={open > 0 ? <Badge variant="secondary">{open} lopend</Badge> : undefined}
          />
        )
      })}
    </RowGrid>
  )
}

function HistoryView({ onOpen }: { onOpen: (id: string) => void }) {
  const store = useLeenLog()
  const [query, setQuery] = React.useState("")
  const returned = store.db.loans
    .filter((l) => l.actualReturn)
    .sort((a, b) => (b.actualReturn ?? 0) - (a.actualReturn ?? 0))

  if (returned.length === 0) {
    return (
      <Empty className="py-14">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <History />
          </EmptyMedia>
          <EmptyTitle>Nog geen historie</EmptyTitle>
          <EmptyDescription>Teruggebrachte spullen komen hier in het archief.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const q = query.toLowerCase()
  const filtered = returned.filter((l) => {
    const item = byId(store.db.items, l.itemId)
    const person = byId(store.db.people, l.personId)
    return !q || item?.name.toLowerCase().includes(q) || person?.name.toLowerCase().includes(q)
  })

  return (
    <div>
      <div className="relative mb-4 max-w-md">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          className="pl-9"
          type="search"
          placeholder="Zoek in historie…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Zoek in historie"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Niks gevonden voor &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <RowGrid>
          {filtered.map((l) => {
            const item = byId(store.db.items, l.itemId)
            const person = byId(store.db.people, l.personId)
            return (
              <RowItem
                key={l.id}
                onClick={() => onOpen(l.id)}
                media={<AvatarMedia text="✓" />}
                title={item?.name ?? "Onbekend"}
                meta={`${person?.name ?? "?"} · terug op ${fmtDate(l.actualReturn ?? 0)}`}
                action={<Badge variant="secondary" className="bg-primary/10 text-primary">Retour</Badge>}
              />
            )
          })}
        </RowGrid>
      )}
    </div>
  )
}
