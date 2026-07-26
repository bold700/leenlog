import { LeenLogProvider } from "@/components/leenlog/store"
import { LeenLogApp } from "@/components/leenlog/leenlog-app"

export default function Page() {
  return (
    <LeenLogProvider>
      <LeenLogApp />
    </LeenLogProvider>
  )
}
