'use client'

import { motion, AnimatePresence } from 'motion/react'
import { UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/use-i18n'

interface Props {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function OnboardingPromptModal({ open, onConfirm, onCancel }: Props) {
  const { messages } = useI18n()
  const copy = messages.dashboard.profileRequired

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="bg-white rounded-3xl px-8 py-10 max-w-sm w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-5">
              <UserCircle className="w-16 h-16 text-brand" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{copy.title}</h2>
            <p className="text-sm text-gray-400 mb-8">{copy.message}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                size="lg"
                onClick={onCancel}
              >
                {copy.no}
              </Button>
              <Button
                variant="gradient"
                className="flex-1 rounded-full"
                size="lg"
                onClick={onConfirm}
              >
                {copy.yes}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
