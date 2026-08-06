import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Workspace } from '../types'

export function useWorkspaces(userId?: string) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    async function load() {
      const { data: owned } = await supabase.from('workspaces').select('*').eq('owner_id', userId)
      const { data: memberRows } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', userId)

      const memberIds = (memberRows ?? []).map((m) => m.workspace_id)
      let memberWorkspaces: Workspace[] = []
      if (memberIds.length) {
        const { data } = await supabase.from('workspaces').select('*').in('id', memberIds)
        memberWorkspaces = (data ?? []) as Workspace[]
      }

      const merged = [...(owned ?? []), ...memberWorkspaces]
      const unique = Array.from(new Map(merged.map((w) => [w.id, w])).values())
      setWorkspaces(unique)
      setLoading(false)
    }

    void load()
  }, [userId])

  async function createWorkspace(name: string, ownerId: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name, slug: `${slug}-${Date.now().toString(36)}`, owner_id: ownerId })
      .select()
      .single()
    if (error) throw error
    await supabase.from('workspace_members').insert({
      workspace_id: data.id,
      user_id: ownerId,
      role: 'owner',
    })
    setWorkspaces((prev) => [...prev, data as Workspace])
    return data as Workspace
  }

  return { workspaces, loading, createWorkspace }
}
