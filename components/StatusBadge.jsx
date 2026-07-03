// Badge de status do teste. Status é estado (não série): cores reservadas,
// sempre acompanhadas de rótulo — nunca cor sozinha.
const STYLES = {
  completed: { label: 'Concluído', cls: 'bg-green-50 text-green-700 border-green-200' },
  aborted:   { label: 'Abortado',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  error:     { label: 'Erro',      cls: 'bg-red-50 text-red-700 border-red-200' },
}

export default function StatusBadge({ status }) {
  const s = STYLES[status] || { label: status || '—', cls: 'bg-gray-100 text-gray-600 border-gray-200' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border ${s.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  )
}
