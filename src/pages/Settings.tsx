import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useMeetingStore } from '../store/useMeetingStore'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { useTheme } from '../hooks/useTheme'
import { upsertProfile, uploadAvatar } from '../lib/profile'
import { useWorkspaces } from '../hooks/useWorkspaces'

export function Settings() {
  const navigate = useNavigate()
  const user = useMeetingStore((s) => s.user)
  const displayName = useMeetingStore((s) => s.displayName)
  const setDisplayName = useMeetingStore((s) => s.setDisplayName)
  const setUser = useMeetingStore((s) => s.setUser)
  const [name, setName] = useState(displayName || user?.displayName || '')
  const [saved, setSaved] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const reduce = useReducedMotion()
  const { theme } = useTheme()
  const { workspaces, createWorkspace } = useWorkspaces(user?.id)

  const initials = (name || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  async function handleSave() {
    if (!user) return
    const trimmed = name.trim() || 'Guest'
    setDisplayName(trimmed)
    setUser({ ...user, displayName: trimmed })
    await upsertProfile(user.id, { display_name: trimmed })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const url = await uploadAvatar(user.id, file)
      await upsertProfile(user.id, { avatar_url: url })
      setUser({ ...user, avatarUrl: url })
    } finally {
      setUploading(false)
    }
  }

  async function handleCreateWorkspace() {
    if (!user || !workspaceName.trim()) return
    await createWorkspace(workspaceName.trim(), user.id)
    setWorkspaceName('')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="mx-auto max-w-lg">
      <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl text-[var(--paper-100)] sm:text-4xl">Settings</h1>
        <p className="mt-2 text-sm text-[var(--paper-400)]">How you show up in meetings.</p>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.06 }}
        className="mt-8 rounded-lg border border-[var(--ink-700)] bg-[var(--ink-900)] p-6"
      >
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => fileRef.current?.click()} className="relative">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ink-700)] font-mono text-lg text-[var(--signal)]">
                {initials}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 rounded-full bg-[var(--signal)] px-1.5 text-[10px] text-[var(--on-signal)]">
              {uploading ? '…' : '+'}
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          <div>
            <p className="text-sm text-[var(--paper-100)]">{user?.email ?? 'Signed in'}</p>
            <p className="font-mono mt-0.5 text-[11px] text-[var(--paper-400)]">{user?.id.slice(0, 8)}…</p>
          </div>
        </div>

        <label className="mt-8 block">
          <span className="font-mono mb-2 block text-[10px] uppercase tracking-[0.14em] text-[var(--paper-400)]">
            Display name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border-0 border-b border-[var(--ink-700)] bg-transparent py-2.5 text-sm text-[var(--paper-100)] outline-none focus:border-[var(--signal)]"
          />
        </label>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={handleSave} className="rounded-md bg-[var(--signal)] px-5 py-2.5 text-sm font-semibold text-[var(--on-signal)]">
            {saved ? 'Saved' : 'Save'}
          </button>
          <button type="button" onClick={handleLogout} className="rounded-md border border-[var(--ink-700)] px-5 py-2.5 text-sm text-[var(--paper-400)]">
            Log out
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.12 }}
        className="mt-4 rounded-lg border border-[var(--ink-700)] bg-[var(--ink-900)] p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--paper-400)]">Appearance</p>
            <p className="mt-1 text-sm text-[var(--paper-100)]">{theme === 'dark' ? 'Dark' : 'Light'} mode</p>
          </div>
          <ThemeToggle className="!border-[var(--ink-700)] !text-[var(--paper-400)]" />
        </div>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.18 }}
        className="mt-4 rounded-lg border border-[var(--ink-700)] bg-[var(--ink-900)] p-6"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--paper-400)]">Workspaces</p>
        <div className="mt-3 flex gap-2">
          <input
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="New workspace name"
            className="flex-1 border-b border-[var(--ink-700)] bg-transparent py-2 text-sm text-[var(--paper-100)] outline-none"
          />
          <button type="button" onClick={handleCreateWorkspace} className="text-sm text-[var(--signal)]">
            Create
          </button>
        </div>
        {workspaces.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-[var(--paper-400)]">
            {workspaces.map((w) => (
              <li key={w.id}>{w.name}</li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  )
}
