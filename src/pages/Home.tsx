import { useRef } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { useMeetingStore } from '../store/useMeetingStore'
import { useAuthSession } from '../hooks/useAuthSession'
import { Button } from '../components/ui/Button'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { HeroPresenceFrame } from '../components/home/HeroPresenceFrame'
import { BeatsStrip } from '../components/home/BeatsStrip'
import { CapabilitiesReel } from '../components/home/CapabilitiesReel'
import { FeaturesIndex } from '../components/home/FeaturesIndex'
import { RoomCodeRitual } from '../components/home/RoomCodeRitual'
import { ClosingCue } from '../components/home/ClosingCue'
import { readJoinParam } from '../lib/joinIntent'

export function Home() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionReady = useAuthSession()
  const user = useMeetingStore((s) => s.user)
  const heroRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  const { scrollY } = useScroll()
  const navBg = useTransform(scrollY, [0, 40], ['rgba(0,0,0,0)', 'var(--surface)'])
  const navBorder = useTransform(scrollY, [0, 40], ['rgba(0,0,0,0)', 'var(--border)'])

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const vignetteY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 40])
  const grainOpacity = useTransform(scrollYProgress, [0, 1], reduce ? [0.04, 0.04] : [0.05, 0.02])

  const stagger = (i: number) =>
    reduce
      ? { initial: false as const, animate: { opacity: 1 }, transition: { duration: 0 } }
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
        }

  if (!sessionReady) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[var(--bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    )
  }

  if (user) {
    const join = readJoinParam(searchParams)
    return <Navigate to={join ? `/dashboard?join=${encodeURIComponent(join)}` : '/dashboard'} replace />
  }

  const joinFromUrl = readJoinParam(searchParams)
  if (joinFromUrl) {
    return <Navigate to={`/login?join=${encodeURIComponent(joinFromUrl)}`} replace />
  }

  return (
    <div className="relative min-h-full overflow-x-hidden bg-[var(--bg)] text-[var(--text)]">
      <motion.header
        style={{
          backgroundColor: navBg,
          borderBottomColor: navBorder,
          borderBottomWidth: 1,
          borderBottomStyle: 'solid',
        }}
        className="fixed inset-x-0 top-0 z-40"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="font-display text-2xl tracking-tight text-[var(--text)]">
            Meetra
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate('/login')} className="!px-3 !py-2">
              Log in
            </Button>
            <Button variant="primary" onClick={() => navigate('/login')} className="!px-3 !py-2">
              New meeting
            </Button>
          </div>
        </div>
      </motion.header>

      <main>
        <section
          ref={heroRef}
          className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-4 pb-16 pt-24 sm:px-6 lg:pb-24"
        >
          <motion.div
            className="cine-vignette absolute inset-0"
            style={{ y: vignetteY }}
            aria-hidden
          />
          <motion.div
            className="cine-grain absolute inset-0"
            style={{ opacity: grainOpacity }}
            aria-hidden
          />

          <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,0.52fr)_minmax(0,0.48fr)]">
            <div className="max-w-xl text-left">
              <motion.p
                {...stagger(0)}
                className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]"
              >
                Instant rooms · Live grid · Host control
              </motion.p>

              <motion.h1
                initial={reduce ? false : { opacity: 0, y: 12, letterSpacing: '0.02em' }}
                animate={{ opacity: 1, y: 0, letterSpacing: '0em' }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }
                }
                className="font-display mt-5 text-[clamp(2.75rem,9vw,5.5rem)] leading-[1.05] tracking-tight text-[var(--text)]"
              >
                You&apos;re on the air.
              </motion.h1>

              <motion.p
                {...stagger(2)}
                className="mt-5 max-w-md text-base leading-relaxed text-[var(--muted)] sm:text-lg"
              >
                Video meetings with waiting rooms, adaptive grids, chat, polls, and host tools —
                start with a code and go live.
              </motion.p>

              <motion.div {...stagger(3)} className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button onClick={() => navigate('/login')} className="w-full sm:w-auto">
                  New meeting
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto"
                >
                  Join with a code
                </Button>
              </motion.div>
            </div>

            <HeroPresenceFrame />
          </div>
        </section>

        <BeatsStrip />
        <CapabilitiesReel />
        <FeaturesIndex />
        <RoomCodeRitual />
        <ClosingCue
          onNewMeeting={() => navigate('/login')}
          onJoin={() => navigate('/login')}
          onLogin={() => navigate('/login')}
          isAuthenticated={false}
        />
      </main>

      <footer className="border-t border-[var(--border)] px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-lg text-[var(--text)]">Meetra</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Rooms that scale. Presence that stays.
            </p>
          </div>
          <p className="group cursor-default text-xs text-[var(--muted)] sm:text-right">
            Developed with{' '}
            <span className="inline-flex overflow-hidden align-bottom text-[var(--accent)]">
              <span className="inline-block max-w-[5em] overflow-hidden whitespace-nowrap transition-all duration-300 ease-out group-hover:max-w-0 group-hover:opacity-0">
                passion
              </span>
              <span className="inline-block max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:max-w-[3em] group-hover:opacity-100">
                love
              </span>
            </span>{' '}
            <span className="text-[var(--text)]">TEAM OG</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
