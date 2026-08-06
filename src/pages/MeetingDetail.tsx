import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useMeetingStore } from '../store/useMeetingStore'
import type { ChatMessage, Participant, Room, RoomNote } from '../types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function MeetingDetail() {
  const { roomId } = useParams<{ roomId: string }>()
  const user = useMeetingStore((s) => s.user)
  const reduce = useReducedMotion()
  const [room, setRoom] = useState<Room | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [notes, setNotes] = useState<RoomNote[]>([])
  const [noteBody, setNoteBody] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) return

    async function load() {
      const [{ data: roomData }, { data: parts }, { data: chat }, { data: noteRows }] =
        await Promise.all([
          supabase.from('rooms').select('*').eq('id', roomId).single(),
          supabase.from('participants').select('*').eq('room_id', roomId).order('joined_at'),
          supabase.from('chat_messages').select('*').eq('room_id', roomId).order('created_at'),
          supabase.from('room_notes').select('*').eq('room_id', roomId).order('created_at', { ascending: false }),
        ])

      setRoom(roomData as Room)
      setParticipants(parts ?? [])
      setMessages(chat ?? [])
      setNotes(noteRows ?? [])
      setLoading(false)
    }

    void load()
  }, [roomId])

  function exportChat(format: 'txt' | 'json') {
    const content =
      format === 'json'
        ? JSON.stringify(messages, null, 2)
        : messages
            .map((m) => `[${formatDate(m.created_at)}] ${m.display_name}: ${m.message}`)
            .join('\n')
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meetra-chat-${room?.room_code ?? roomId}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function saveNote() {
    if (!roomId || !user || !noteBody.trim()) return
    const { data, error } = await supabase
      .from('room_notes')
      .insert({ room_id: roomId, author_id: user.id, body: noteBody.trim() })
      .select()
      .single()
    if (!error && data) {
      setNotes((prev) => [data as RoomNote, ...prev])
      setNoteBody('')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--signal)] border-t-transparent" />
      </div>
    )
  }

  if (!room) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-[var(--paper-400)]">Meeting not found.</p>
        <Link to="/history" className="mt-4 inline-block text-[var(--signal)] hover:underline">
          Back to history
        </Link>
      </div>
    )
  }

  const role = room.host_id === user?.id ? 'Host' : 'Participant'

  return (
    <div className="mx-auto max-w-3xl">
      <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/history" className="text-sm text-[var(--paper-400)] hover:text-[var(--signal)]">
          ← History
        </Link>
        <h1 className="font-display mt-4 text-3xl text-[var(--paper-100)]">
          {room.title ?? room.room_code}
        </h1>
        <p className="font-mono mt-2 text-sm text-[var(--paper-400)]">
          {room.room_code} · {formatDate(room.created_at)} · {role}
        </p>
      </motion.div>

      <section className="mt-8 rounded-lg border border-[var(--ink-700)] bg-[var(--ink-900)] p-6">
        <h2 className="font-display text-xl text-[var(--paper-100)]">Participants</h2>
        <ul className="mt-4 space-y-2">
          {participants.map((p) => (
            <li key={p.id} className="flex justify-between text-sm text-[var(--paper-400)]">
              <span>{p.display_name ?? 'Guest'}</span>
              <span className="font-mono text-xs">{formatDate(p.joined_at)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-lg border border-[var(--ink-700)] bg-[var(--ink-900)] p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-[var(--paper-100)]">Chat</h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => exportChat('txt')} className="text-xs text-[var(--signal)]">
              Export .txt
            </button>
            <button type="button" onClick={() => exportChat('json')} className="text-xs text-[var(--signal)]">
              Export .json
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-[var(--paper-400)]">{messages.length} messages</p>
      </section>

      <section className="mt-4 rounded-lg border border-[var(--ink-700)] bg-[var(--ink-900)] p-6">
        <h2 className="font-display text-xl text-[var(--paper-100)]">Notes</h2>
        <textarea
          value={noteBody}
          onChange={(e) => setNoteBody(e.target.value)}
          placeholder="Add a note about this meeting…"
          rows={3}
          className="mt-4 w-full resize-none border-b border-[var(--ink-700)] bg-transparent py-2 text-sm text-[var(--paper-100)] outline-none focus:border-[var(--signal)]"
        />
        <button
          type="button"
          onClick={saveNote}
          className="mt-3 rounded-md bg-[var(--signal)] px-4 py-2 text-sm font-semibold text-[var(--on-signal)]"
        >
          Save note
        </button>
        <ul className="mt-4 space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-md border border-[var(--ink-700)] p-3 text-sm text-[var(--paper-400)]">
              {n.body}
              <p className="font-mono mt-1 text-[10px] text-[var(--paper-400)]/60">{formatDate(n.created_at)}</p>
            </li>
          ))}
          {notes.length === 0 && (
            <p className="text-sm text-[var(--paper-400)]/60">No notes yet.</p>
          )}
        </ul>
      </section>
    </div>
  )
}
