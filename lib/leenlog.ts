import type { DB, Item, Loan, LoanStatus, Person } from "./types"

export const KEY = "leenlog.v1"
export const DAY = 86400000

export const uid = () =>
  "id" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

export const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export const daysDiff = (ts: number) =>
  Math.round((ts - startOfToday()) / DAY)

export function loanStatus(loan: Loan): LoanStatus {
  if (loan.actualReturn) return "returned"
  if (loan.status === "concept") return "concept"
  if (loan.expectedReturn < startOfToday()) return "overdue"
  return "out"
}

// De lopende (niet-teruggebrachte, niet-concept) lening voor een item, indien aanwezig.
export function activeLoanForItem(loans: Loan[], itemId: string): Loan | undefined {
  return loans.find(
    (l) => l.itemId === itemId && !l.actualReturn && l.status !== "concept"
  )
}

// Alle leningen van één item of persoon, nieuwste eerst.
export function historyFor(
  loans: Loan[],
  key: "itemId" | "personId",
  id: string
): Loan[] {
  return loans
    .filter((l) => l[key] === id)
    .sort((a, b) => b.dateOut - a.dateOut)
}

export function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function euro(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return ""
  return "€ " + Number(n).toLocaleString("nl-NL")
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

// Normalize a (Dutch) phone number to international wa.me format: digits only, 31...
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  let d = raw.replace(/[^\d+]/g, "")
  if (d.startsWith("+")) d = d.slice(1)
  else if (d.startsWith("00")) d = d.slice(2)
  else if (d.startsWith("0")) d = "31" + d.replace(/^0+/, "")
  d = d.replace(/\D/g, "")
  return d.length >= 8 ? d : null
}

// Generieke wa.me-link naar een persoon met een vrij bericht.
export function waLink(person: Person, message: string): string | null {
  const phone = normalizePhone(person.phone)
  if (!phone) return null
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function whatsappLink(person: Person, itemName: string): string | null {
  const first = person.name.split(" ")[0]
  return waLink(
    person,
    `Hoi ${first}! Kleine reminder, heb je de ${itemName} nog in gebruik, of zal ik 'm binnenkort ophalen? 😊`
  )
}

// Korte, leesbare bruikleen-voorwaarden. Laat de tekst één keer door een jurist checken
// voordat je 'm echt gebruikt.
export function bruikleenTerms(item: Item): string[] {
  const value = item.estimatedValue != null ? ` (${euro(item.estimatedValue)})` : ""
  return [
    `De ${item.name} blijft eigendom van de uitlener.`,
    `Je brengt 'm terug op de afgesproken datum, in dezelfde staat.`,
    `Bij schade of verlies vergoed je de kosten tot de geschatte waarde${value}.`,
  ]
}

// Leenbevestiging: het bericht dat de lener met "JA" bevestigt.
export function confirmationMessage(item: Item, person: Person, loan: Loan): string {
  const first = person.name.split(" ")[0]
  const lines = [
    `Hoi ${first}, even kort ter bevestiging van wat je van me leent 🙌`,
    ``,
    `• Wat: ${item.name}${item.estimatedValue != null ? ` (waarde ca. ${euro(item.estimatedValue)})` : ""}`,
    `• Mee vanaf: ${fmtDate(loan.dateOut)}`,
    `• Afgesproken terug: ${fmtDate(loan.expectedReturn)}`,
  ]
  if (loan.conditionOut) lines.push(`• Staat nu: ${loan.conditionOut}`)
  if (loan.terms) {
    lines.push(``, `Even de afspraken:`)
    for (const t of bruikleenTerms(item)) lines.push(`- ${t}`)
  }
  lines.push(``, `Klopt dit? Reageer even met JA 👍`)
  return lines.join("\n")
}

export function returnInfo(
  loan: Loan
): { text: string; tone: "overdue" | "soon" | "ok" | "concept" } {
  const st = loanStatus(loan)
  if (st === "concept") {
    const d = daysDiff(loan.dateOut)
    if (d <= 0) return { text: "Klaar om te starten", tone: "concept" }
    if (d === 1) return { text: "Gepland vanaf morgen", tone: "concept" }
    return { text: `Gepland over ${d} dagen`, tone: "concept" }
  }
  const d = daysDiff(loan.expectedReturn)
  if (st === "overdue") return { text: `${-d} dagen te laat`, tone: "overdue" }
  if (d === 0) return { text: "Vandaag terug", tone: "soon" }
  if (d === 1) return { text: "Morgen terug", tone: "soon" }
  return { text: `Nog ${d} dagen`, tone: "ok" }
}

export function byId<T extends { id: string }>(arr: T[], id: string | null | undefined) {
  return arr.find((x) => x.id === id)
}

export function toDateInput(ts: number) {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

export function fromDateInput(value: string) {
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y, m - 1, d).getTime()
}

export function seed(): DB {
  const now = Date.now()
  const p1 = uid(), p2 = uid(), p3 = uid()
  const i1 = uid(), i2 = uid(), i3 = uid(), i4 = uid()
  return {
    items: [
      { id: i1, name: "Bosch boormachine", description: "Blauw, met koffer", estimatedValue: 180, status: "out", createdAt: now - 30 * DAY },
      { id: i2, name: "Dakkoffer BOLD700", description: "Merkkoffer voor op het dak", estimatedValue: 650, status: "out", createdAt: now - 20 * DAY },
      { id: i3, name: "Aanhangwagen", description: "Ongeremd, 750 kg", estimatedValue: 900, status: "available", createdAt: now - 60 * DAY },
      { id: i4, name: "Steekwagen", description: "", estimatedValue: 45, status: "available", createdAt: now - 60 * DAY },
    ],
    people: [
      { id: p1, name: "Jeroen de Vries", phone: "0612345678", email: "", note: "buurman" },
      { id: p2, name: "Sanne Bakker", phone: "+31687654321", email: "sanne@example.com", note: "klant BOLD700" },
      { id: p3, name: "Tim Jansen", phone: "0698765432", email: "", note: "" },
    ],
    loans: [
      // Te laat, nog niet bevestigd
      { id: uid(), itemId: i1, personId: p1, dateOut: now - 12 * DAY, expectedReturn: now - 5 * DAY, actualReturn: null, status: "out", notes: "", conditionOut: "Lichte slijtage op boorkop", terms: true, confirmedAt: null },
      // Lopend, netjes bevestigd
      { id: uid(), itemId: i2, personId: p2, dateOut: now - 4 * DAY, expectedReturn: now + 3 * DAY, actualReturn: null, status: "out", notes: "Voor fotoshoot", conditionOut: "Als nieuw, geen krassen", terms: true, confirmedAt: now - 4 * DAY },
      // Concept-reservering voor de Bosch (ligt nu bij Jeroen), gepland voor Tim
      { id: uid(), itemId: i1, personId: p3, dateOut: now + 2 * DAY, expectedReturn: now + 9 * DAY, actualReturn: null, status: "concept", notes: "Na Jeroen", terms: true, confirmedAt: null },
      // Historie: al teruggebracht, met staat bij uitgifte en retour
      { id: uid(), itemId: i4, personId: p3, dateOut: now - 40 * DAY, expectedReturn: now - 33 * DAY, actualReturn: now - 34 * DAY, status: "returned", notes: "", conditionOut: "Gaaf", conditionIn: "Netjes terug, geen schade", terms: true, confirmedAt: now - 40 * DAY },
    ],
  }
}

export function loadDB(): DB {
  if (typeof window === "undefined") return { items: [], people: [], loans: [] }
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as DB
  } catch {
    // ignore corrupt storage
  }
  const s = seed()
  window.localStorage.setItem(KEY, JSON.stringify(s))
  return s
}

export function saveDB(db: DB) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, JSON.stringify(db))
}

export function resetDB(): DB {
  const s = seed()
  saveDB(s)
  return s
}
