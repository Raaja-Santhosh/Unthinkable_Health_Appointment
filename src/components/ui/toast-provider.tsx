"use client"
import { Toaster } from "sonner"

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          fontFamily: 'var(--font-sans)',
          borderRadius: '0.25rem',
        },
        className: 'border border-border',
      }}
      richColors
      closeButton
    />
  )
}
