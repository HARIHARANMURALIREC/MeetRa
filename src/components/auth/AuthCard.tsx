import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '../ui/ThemeToggle'

interface AuthCardProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export function AuthCard({ children, title, subtitle }: AuthCardProps) {
  const reduce = useReducedMotion()

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[var(--bg)] px-4 py-12">
      <div className="cine-vignette pointer-events-none absolute inset-0 opacity-80" aria-hidden />
      <div className="cine-grain absolute inset-0" aria-hidden />

      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8"
      >
        <Link
          to="/"
          className="font-display mb-8 block text-center text-2xl text-[var(--text)]"
        >
          Meetra
        </Link>
        <h1 className="font-display text-center text-[32px] leading-tight tracking-tight text-[var(--text)] sm:text-[36px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-center text-sm text-[var(--muted)]">{subtitle}</p>
        )}
        <div className="mt-8">{children}</div>
      </motion.div>
    </div>
  )
}
