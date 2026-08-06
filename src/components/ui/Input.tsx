import type { InputHTMLAttributes, Ref } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  inputRef?: Ref<HTMLInputElement>
  mono?: boolean
}

export function Input({
  label,
  className = '',
  id,
  inputRef,
  mono = false,
  ...rest
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <label className="block">
      {label && (
        <span className="font-mono mb-2 block text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          {label}
        </span>
      )}
      <input
        ref={inputRef}
        id={inputId}
        className={`w-full border-0 border-b border-[var(--border)] bg-transparent px-0 py-2.5 text-[var(--text)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--muted)]/50 focus:border-[var(--accent)] focus:shadow-[0_1px_0_0_var(--accent)] ${
          mono ? 'font-mono text-sm tracking-wide' : 'font-sans text-sm'
        } ${className}`}
        {...rest}
      />
    </label>
  )
}
