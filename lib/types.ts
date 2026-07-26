export type ItemStatus = "available" | "out"
// "concept" = geplande reservering (item nog bij iemand anders of bewust vooruit gepland)
export type LoanStatus = "out" | "returned" | "overdue" | "concept"

export interface Item {
  id: string
  name: string
  description: string
  estimatedValue: number | null
  status: ItemStatus
  createdAt: number
}

export interface Person {
  id: string
  name: string
  phone: string
  email: string
  note: string
}

export interface Loan {
  id: string
  itemId: string
  personId: string
  dateOut: number
  expectedReturn: number
  actualReturn: number | null
  status: LoanStatus
  notes: string
  // Juridische borging (informeel, per lening). Optioneel voor oudere records.
  conditionOut?: string // staat bij uitgifte
  conditionIn?: string // staat bij retour
  terms?: boolean // bruikleen-voorwaarden van toepassing
  confirmedAt?: number | null // wanneer de lener akkoord gaf ("bevestigd op")
}

export interface DB {
  items: Item[]
  people: Person[]
  loans: Loan[]
}

export type Tab = "loans" | "items" | "people" | "history"
