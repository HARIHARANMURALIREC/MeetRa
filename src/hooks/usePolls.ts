import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Poll, PollVote } from '../types'

export function usePolls(roomId: string) {
  const [polls, setPolls] = useState<Poll[]>([])
  const [votes, setVotes] = useState<PollVote[]>([])

  useEffect(() => {
    async function load() {
      const [{ data: pollData }, { data: voteData }] = await Promise.all([
        supabase.from('polls').select('*').eq('room_id', roomId).order('created_at', { ascending: false }),
        supabase.from('poll_votes').select('*'),
      ])
      if (pollData) {
        setPolls(
          pollData.map((p) => ({
            ...p,
            options: Array.isArray(p.options) ? p.options : JSON.parse(String(p.options ?? '[]')),
          })),
        )
      }
      if (voteData) setVotes(voteData)
    }

    void load()

    const channel = supabase
      .channel(`polls-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls', filter: `room_id=eq.${roomId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, () => load())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  async function createPoll(question: string, options: string[], userId: string) {
    const { error } = await supabase.from('polls').insert({
      room_id: roomId,
      question,
      options,
      created_by: userId,
    })
    if (error) throw error
  }

  async function vote(pollId: string, optionIndex: number, userId: string) {
    const { error } = await supabase.from('poll_votes').insert({
      poll_id: pollId,
      user_id: userId,
      option_index: optionIndex,
    })
    if (error) throw error
  }

  async function closePoll(pollId: string) {
    const { error } = await supabase
      .from('polls')
      .update({ closed_at: new Date().toISOString() })
      .eq('id', pollId)
    if (error) throw error
  }

  function votesForPoll(pollId: string) {
    return votes.filter((v) => v.poll_id === pollId)
  }

  return { polls, votes, createPoll, vote, closePoll, votesForPoll }
}
