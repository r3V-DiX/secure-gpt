// packages/extension/src/popup/components/StatCard.tsx

interface StatCardProps {
  label: string
  value: number
  colorClass: string
  bgClass: string
}

export function StatCard({ label, value, colorClass, bgClass }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-md p-2.5 text-center border shadow-xs flex flex-col items-center justify-center ${bgClass}`}>
      <div className={`text-xl font-bold leading-none mb-1 tracking-tight ${colorClass}`}>{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{label}</div>
    </div>
  )
}
