import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useMeetingStore } from '../store/useMeetingStore'
import type { ChatMessage } from '../types'

export function useChat(roomId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const user = useMeetingStore((s) => s.user)

  useEffect(() => {
    async function loadHistory() {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
      if (data) setMessages(data)
    }

    loadHistory()

    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  async function sendMessage(message: string, displayName: string) {
    if (!user) return
    const { error } = await supabase.from('chat_messages').insert({
      room_id: roomId,
      user_id: user.id,
      display_name: displayName,
      message,
    })
    if (error) throw error
  }

  return { messages, sendMessage }
}
