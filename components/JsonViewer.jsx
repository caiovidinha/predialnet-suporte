'use client'

import { useState } from 'react'

// Bloco colapsável que renderiza um objeto como JSON formatado.
export default function JsonViewer({ label, value, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const isEmpty = value === null || value === undefined ||
    (typeof value === 'object' && Object.keys(value).length === 0)

  return (
    <div className="border border-gray-200">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
      >
        <span>{label}</span>
        <span className="text-gray-400 text-xs">
          {isEmpty ? 'vazio' : open ? 'ocultar ▲' : 'mostrar ▼'}
        </span>
      </button>
      {open && (
        <pre className="px-3 py-2 text-xs bg-gray-50 border-t border-gray-200 overflow-x-auto text-gray-700 leading-relaxed">
          {isEmpty ? '—' : JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  )
}
