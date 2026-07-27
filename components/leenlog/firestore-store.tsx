"use client"

import * as React from "react"
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore"

import type { Item, Loan, Person } from "@/lib/types"
import { getFirebase } from "@/lib/firebase"
import { byId, seed, startOfToday } from "@/lib/leenlog"
import { StoreContext, type Store } from "./store"

// Verwijder undefined-velden: Firestore accepteert die niet.
function clean<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v
  return out as T
}

export function FirestoreProvider({
  uid,
  children,
}: {
  uid: string
  children: React.ReactNode
}) {
  const { db: fs } = getFirebase()

  const [items, setItems] = React.useState<Item[]>([])
  const [people, setPeople] = React.useState<Person[]>([])
  const [loans, setLoans] = React.useState<Loan[]>([])
  const [loaded, setLoaded] = React.useState({ items: false, people: false, loans: false })

  React.useEffect(() => {
    const mine = (name: string) => query(collection(fs, name), where("ownerId", "==", uid))
    const unsubItems = onSnapshot(mine("items"), (snap) => {
      setItems(snap.docs.map((d) => d.data() as Item))
      setLoaded((l) => ({ ...l, items: true }))
    })
    const unsubPeople = onSnapshot(mine("people"), (snap) => {
      setPeople(snap.docs.map((d) => d.data() as Person))
      setLoaded((l) => ({ ...l, people: true }))
    })
    const unsubLoans = onSnapshot(mine("loans"), (snap) => {
      setLoans(snap.docs.map((d) => d.data() as Loan))
      setLoaded((l) => ({ ...l, loans: true }))
    })
    return () => {
      unsubItems()
      unsubPeople()
      unsubLoans()
    }
  }, [fs, uid])

  const ready = loaded.items && loaded.people && loaded.loans

  const store = React.useMemo<Store>(() => {
    const newId = (name: string) => doc(collection(fs, name)).id
    const ref = (name: string, id: string) => doc(fs, name, id)

    return {
      db: { items, people, loans },
      ready,
      addItem: (data) => {
        const item: Item = {
          id: newId("items"),
          name: data.name.trim(),
          description: data.description.trim(),
          estimatedValue: data.estimatedValue,
          status: "available",
          createdAt: Date.now(),
          ownerId: uid,
        }
        void setDoc(ref("items", item.id), clean(item))
        return item
      },
      updateItem: (id, data) => void updateDoc(ref("items", id), clean(data)),
      deleteItem: (id) => void deleteDoc(ref("items", id)),
      addPerson: (data) => {
        const person: Person = { id: newId("people"), ...data, ownerId: uid }
        void setDoc(ref("people", person.id), clean(person))
        return person
      },
      updatePerson: (id, data) => void updateDoc(ref("people", id), clean(data)),
      deletePerson: (id) => void deleteDoc(ref("people", id)),
      addLoan: (data) => {
        const concept = Boolean(data.concept)
        const loan: Loan = {
          id: newId("loans"),
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
          ownerId: uid,
        }
        void setDoc(ref("loans", loan.id), clean(loan))
        if (!concept) void updateDoc(ref("items", data.itemId), { status: "out" })
        return loan
      },
      activateLoan: (id) => {
        const loan = byId(loans, id)
        if (!loan) return
        void updateDoc(ref("loans", id), { status: "out", dateOut: startOfToday() })
        void updateDoc(ref("items", loan.itemId), { status: "out" })
      },
      confirmLoan: (id) => void updateDoc(ref("loans", id), { confirmedAt: Date.now() }),
      markReturned: (id, conditionIn) => {
        const loan = byId(loans, id)
        if (!loan) return
        void updateDoc(
          ref("loans", id),
          clean({
            actualReturn: Date.now(),
            status: "returned" as const,
            conditionIn: conditionIn?.trim() ?? loan.conditionIn ?? "",
          })
        )
        void updateDoc(ref("items", loan.itemId), { status: "available" })
      },
      deleteLoan: (id) => {
        const loan = byId(loans, id)
        if (loan && !loan.actualReturn && loan.status !== "concept") {
          void updateDoc(ref("items", loan.itemId), { status: "available" })
        }
        void deleteDoc(ref("loans", id))
      },
      reset: () => {
        const batch = writeBatch(fs)
        items.forEach((i) => batch.delete(ref("items", i.id)))
        people.forEach((p) => batch.delete(ref("people", p.id)))
        loans.forEach((l) => batch.delete(ref("loans", l.id)))
        const s = seed()
        s.items.forEach((i) => batch.set(ref("items", i.id), clean({ ...i, ownerId: uid })))
        s.people.forEach((p) => batch.set(ref("people", p.id), clean({ ...p, ownerId: uid })))
        s.loans.forEach((l) => batch.set(ref("loans", l.id), clean({ ...l, ownerId: uid })))
        void batch.commit()
      },
    }
  }, [fs, uid, items, people, loans, ready])

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}
