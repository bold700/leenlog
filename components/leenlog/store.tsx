"use client"

import * as React from "react"

import type { DB, Item, Loan, Person } from "@/lib/types"
import { byId, loadDB, resetDB, saveDB, startOfToday, uid } from "@/lib/leenlog"

export interface Store {
  db: DB
  ready: boolean
  addItem: (data: Pick<Item, "name" | "description" | "estimatedValue">) => Item
  updateItem: (id: string, data: Partial<Item>) => void
  deleteItem: (id: string) => void
  addPerson: (data: Omit<Person, "id">) => Person
  updatePerson: (id: string, data: Partial<Person>) => void
  deletePerson: (id: string) => void
  addLoan: (data: {
    itemId: string
    personId: string
    dateOut: number
    expectedReturn: number
    notes: string
    concept?: boolean
    conditionOut?: string
    terms?: boolean
  }) => Loan
  activateLoan: (id: string) => void
  confirmLoan: (id: string) => void
  markReturned: (id: string, conditionIn?: string) => void
  deleteLoan: (id: string) => void
  reset: () => void
}

export const StoreContext = React.createContext<Store | null>(null)

const EMPTY: DB = { items: [], people: [], loans: [] }

export function LeenLogProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = React.useState<DB>(EMPTY)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    setDb(loadDB())
    setReady(true)
  }, [])

  const commit = React.useCallback((next: DB) => {
    setDb(next)
    saveDB(next)
  }, [])

  const store = React.useMemo<Store>(
    () => ({
      db,
      ready,
      addItem: (data) => {
        const item: Item = {
          id: uid(),
          name: data.name.trim(),
          description: data.description.trim(),
          estimatedValue: data.estimatedValue,
          status: "available",
          createdAt: Date.now(),
        }
        commit({ ...db, items: [...db.items, item] })
        return item
      },
      updateItem: (id, data) =>
        commit({
          ...db,
          items: db.items.map((it) => (it.id === id ? { ...it, ...data } : it)),
        }),
      deleteItem: (id) =>
        commit({ ...db, items: db.items.filter((it) => it.id !== id) }),
      addPerson: (data) => {
        const person: Person = { id: uid(), ...data }
        commit({ ...db, people: [...db.people, person] })
        return person
      },
      updatePerson: (id, data) =>
        commit({
          ...db,
          people: db.people.map((p) => (p.id === id ? { ...p, ...data } : p)),
        }),
      deletePerson: (id) =>
        commit({ ...db, people: db.people.filter((p) => p.id !== id) }),
      addLoan: (data) => {
        const concept = Boolean(data.concept)
        const loan: Loan = {
          id: uid(),
          itemId: data.itemId,
          personId: data.personId,
          dateOut: data.dateOut,
          expectedReturn: data.expectedReturn,
          actualReturn: null,
          status: concept ? "concept" : "out",
          notes: data.notes.trim(),
          conditionOut: data.conditionOut?.trim() ?? "",
          conditionIn: "",
          terms: data.terms ?? true,
          confirmedAt: null,
        }
        commit({
          ...db,
          loans: [...db.loans, loan],
          // Een concept-reservering verandert de status van het item niet:
          // het is al uitgeleend of wordt pas later opgehaald.
          items: concept
            ? db.items
            : db.items.map((it) =>
                it.id === data.itemId ? { ...it, status: "out" } : it
              ),
        })
        return loan
      },
      activateLoan: (id) => {
        const loan = byId(db.loans, id)
        if (!loan) return
        commit({
          ...db,
          loans: db.loans.map((l) =>
            l.id === id
              ? { ...l, status: "out" as const, dateOut: startOfToday() }
              : l
          ),
          items: db.items.map((it) =>
            it.id === loan.itemId ? { ...it, status: "out" } : it
          ),
        })
      },
      confirmLoan: (id) =>
        commit({
          ...db,
          loans: db.loans.map((l) =>
            l.id === id ? { ...l, confirmedAt: Date.now() } : l
          ),
        }),
      markReturned: (id, conditionIn) => {
        const loan = byId(db.loans, id)
        if (!loan) return
        commit({
          ...db,
          loans: db.loans.map((l) =>
            l.id === id
              ? {
                  ...l,
                  actualReturn: Date.now(),
                  status: "returned" as const,
                  conditionIn: conditionIn?.trim() ?? l.conditionIn ?? "",
                }
              : l
          ),
          items: db.items.map((it) =>
            it.id === loan.itemId ? { ...it, status: "available" } : it
          ),
        })
      },
      deleteLoan: (id) => {
        const loan = byId(db.loans, id)
        const items = loan && !loan.actualReturn
          ? db.items.map((it) =>
              it.id === loan.itemId ? { ...it, status: "available" as const } : it
            )
          : db.items
        commit({ ...db, items, loans: db.loans.filter((l) => l.id !== id) })
      },
      reset: () => commit(resetDB()),
    }),
    [db, ready, commit]
  )

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useLeenLog() {
  const ctx = React.useContext(StoreContext)
  if (!ctx) throw new Error("useLeenLog must be used within LeenLogProvider")
  return ctx
}
