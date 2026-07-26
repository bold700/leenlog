"use client"

import { Badge } from "@/components/ui/badge"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { byId, fmtDate, historyFor, loanStatus } from "@/lib/leenlog"
import { useLeenLog } from "./store"

function StatusBadge({ status }: { status: ReturnType<typeof loanStatus> }) {
  if (status === "returned")
    return <Badge variant="secondary" className="bg-primary/10 text-primary">Retour</Badge>
  if (status === "overdue") return <Badge variant="destructive">Te laat</Badge>
  if (status === "concept") return <Badge variant="outline">Concept</Badge>
  return <Badge variant="secondary">Lopend</Badge>
}

export function LoanHistoryList({
  by,
  id,
}: {
  by: "personId" | "itemId"
  id: string
}) {
  const store = useLeenLog()
  const loans = historyFor(store.db.loans, by, id)

  if (loans.length === 0) {
    return <p className="text-muted-foreground text-sm">Nog geen leningen vastgelegd.</p>
  }

  return (
    <ItemGroup className="gap-2.5">
      {loans.map((l) => {
        const status = loanStatus(l)
        // Bij een persoon tonen we het item; bij een item tonen we de persoon.
        const label =
          by === "personId"
            ? byId(store.db.items, l.itemId)?.name ?? "Onbekend item"
            : byId(store.db.people, l.personId)?.name ?? "Onbekend persoon"
        const period = l.actualReturn
          ? `${fmtDate(l.dateOut)} → terug ${fmtDate(l.actualReturn)}`
          : `${fmtDate(l.dateOut)} → verwacht ${fmtDate(l.expectedReturn)}`
        return (
          <Item key={l.id} variant="muted" size="sm">
            <ItemContent>
              <ItemTitle>{label}</ItemTitle>
              <ItemDescription>{period}</ItemDescription>
            </ItemContent>
            <ItemMedia variant="default">
              <StatusBadge status={status} />
            </ItemMedia>
          </Item>
        )
      })}
    </ItemGroup>
  )
}
