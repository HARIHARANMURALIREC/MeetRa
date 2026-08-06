import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useMeetingStore } from '../../store/useMeetingStore'
import { ThemeToggle } from '../ui/ThemeToggle'
import { useWorkspaces } from '../../hooks/useWorkspaces'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/history', label: 'History', end: false },
  { to: '/settings', label: 'Settings', end: false },
]

const toggleClass =
  '!border-[var(--ink-700)] !text-[var(--paper-400)] hover:!border-[var(--signal)] hover:!text-[var(--paper-100)]'

export function DashboardShell() {
  const user = useMeetingStore((s) => s.user)
  const activeWorkspace = useMeetingStore((s) => s.activeWorkspace)
  const setActiveWorkspace = useMeetingStore((s) => s.setActiveWorkspace)
  const navigate = useNavigate()
  const { workspaces } = useWorkspaces(user?.id)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const initials = (user?.displayName ?? '?')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="app-shell flex min-h-dvh flex-col md:flex-row">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-[var(--ink-700)] bg-[var(--ink-950)] md:flex md:min-h-dvh">
        <div className="flex items-center justify-between gap-2 px-5 py-6">
          <span className="font-display text-xl text-[var(--paper-100)]">Meetra</span>
          <ThemeToggle className={toggleClass} />
        </div>

        {workspaces.length > 0 && (
          <div className="px-3 pb-2">
            <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--paper-400)]">
              Workspace
            </label>
            <select
              value={activeWorkspace?.id ?? ''}
              onChange={(e) => {
                const ws = workspaces.find((w) => w.id === e.target.value)
                setActiveWorkspace(ws ?? null)
              }}
              className="mt-1 w-full rounded-md border border-[var(--ink-700)] bg-[var(--ink-900)] px-2 py-1.5 text-xs text-[var(--paper-100)]"
            >
              <option value="">Personal</option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="flex flex-1 flex-col gap-0.5 px-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-r-md px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'border-l-2 border-[var(--signal)] bg-transparent pl-[10px] text-[var(--signal)]'
                    : 'border-l-2 border-transparent pl-[10px] text-[var(--paper-400)] hover:text-[var(--paper-100)]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-[var(--ink-700)] p-4">
          <div className="flex items-center gap-3">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ink-900)] font-mono text-xs text-[var(--signal)]">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-[var(--paper-100)]">{user?.displayName}</p>
              <button type="button" onClick={handleLogout} className="text-xs text-[var(--paper-400)] hover:text-[var(--signal)]">
                Log out
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <header className="flex items-center justify-between border-b border-[var(--ink-700)] px-4 py-4 md:hidden">
          <span className="font-display text-lg text-[var(--paper-100)]">Meetra</span>
          <div className="flex items-center gap-2">
            <ThemeToggle className={toggleClass} />
            <button type="button" onClick={handleLogout} className="text-xs text-[var(--paper-400)] hover:text-[var(--signal)]">
              Log out
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--ink-700)] bg-[var(--ink-950)] md:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-3 text-[11px] ${
                isActive ? 'text-[var(--signal)]' : 'text-[var(--paper-400)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`h-0.5 w-6 rounded-full ${isActive ? 'bg-[var(--signal)]' : 'bg-transparent'}`} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
