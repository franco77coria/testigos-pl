'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  titulo: string
  resumen: { label: string; valor: string }[]
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ open, titulo, resumen, onConfirm, onCancel }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-5"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-7 max-w-[360px] w-full text-center"
            style={{ border: '1px solid #E2E8F0', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
          >
            <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <AlertTriangle size={22} className="text-amber-500" />
            </div>

            <h3 style={{ fontFamily: 'Montserrat, sans-serif' }} className="text-base font-bold text-[#1a1a1a] mb-1">{titulo}</h3>
            <p className="text-xs text-[#718096] mb-5">Verifique los datos antes de guardar</p>

            <div className="rounded-xl p-4 mb-5 space-y-3" style={{ background: '#F8F9FA', border: '1px solid #E2E8F0' }}>
              {resumen.map((r) => (
                <div key={r.label} className="flex justify-between items-center">
                  <span className="text-xs text-[#718096]">{r.label}</span>
                  <span className="text-base font-bold text-[#E31837]">{r.valor}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 bg-[#F8F9FA] text-[#4a5568] rounded-xl font-semibold text-sm transition-colors hover:bg-[#E2E8F0]"
                style={{ border: '1px solid #E2E8F0', minHeight: '44px' }}
              >
                Revisar
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 text-white rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.25)', minHeight: '44px' }}
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
