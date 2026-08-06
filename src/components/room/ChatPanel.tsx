import { useEffect, useRef, useState } from 'react'
import { Paperclip } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useChat } from '../../hooks/useChat'
import { useMeetingStore } from '../../store/useMeetingStore'
import { PanelCloseButton } from './PanelCloseButton'
import { RoomPanelPortal } from './RoomPanelPortal'

interface ChatPanelProps {
  roomId: string
}

function ChatAttachmentLink({ path, name }: { path: string; name: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase.storage
      .from('chat-files')
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (!cancelled) setUrl(data?.signedUrl ?? null)
      })
    return () => {
      cancelled = true
    }
  }, [path])

  if (!url) {
    return (
      <span className="mt-0.5 flex items-center gap-1 text-sm text-[var(--muted)]">
        <Paperclip className="h-3.5 w-3.5 shrink-0" />
        {name}
      </span>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-0.5 flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
    >
      <Paperclip className="h-3.5 w-3.5 shrink-0" />
      {name}
    </a>
  )
}

export function ChatPanel({ roomId }: ChatPanelProps) {
  const chatOpen = useMeetingStore((s) => s.chatOpen)
  const displayName = useMeetingStore((s) => s.displayName)
  const user = useMeetingStore((s) => s.user)
  const setChatOpen = useMeetingStore((s) => s.setChatOpen)
  const { messages, sendMessage } = useChat(roomId)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!chatOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input = inputRef.current
    if (!input?.value.trim()) return
    await sendMessage(input.value.trim(), displayName || user?.displayName || 'Guest')
    input.value = ''
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const path = `${roomId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('chat-files').upload(path, file)
      if (uploadError) throw uploadError

      await supabase.from('chat_messages').insert({
        room_id: roomId,
        user_id: user.id,
        display_name: displayName || user.displayName,
        message: file.name,
        attachment_path: path,
        attachment_name: file.name,
      })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <RoomPanelPortal>
      <div className="room-shell fixed inset-x-0 bottom-[7rem] z-[100] flex h-[min(50vh,24rem)] flex-col rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl sm:inset-x-auto sm:bottom-0 sm:right-0 sm:top-0 sm:h-dvh sm:max-h-none sm:w-80 sm:rounded-none sm:rounded-l-2xl sm:border-l sm:border-t-0">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h3 className="font-semibold text-[var(--text)]">In-call chat</h3>
          <PanelCloseButton onClick={() => setChatOpen(false)} label="Close chat" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted)]">No messages yet. Say hello!</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="mb-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-[var(--text)]">{msg.display_name ?? 'Guest'}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {msg.attachment_path ? (
                  <ChatAttachmentLink
                    path={msg.attachment_path}
                    name={msg.attachment_name ?? msg.message}
                  />
                ) : (
                  <p className="mt-0.5 text-sm text-[var(--muted)]">{msg.message}</p>
                )}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex shrink-0 gap-2 border-t border-[var(--border)] p-3">
          <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex shrink-0 items-center justify-center rounded-md p-2 text-[var(--muted)] transition hover:bg-[var(--bg)] hover:text-[var(--text)]"
            title="Attach file"
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={inputRef}
            type="text"
            placeholder="Send a message..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </form>
      </div>
    </RoomPanelPortal>
  )
}
