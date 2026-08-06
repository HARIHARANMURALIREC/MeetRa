import { supabase } from './supabase'
import type { Profile } from '../types'

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) return null
  return data
}

export async function upsertProfile(userId: string, updates: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data as Profile
}

export async function uploadAvatar(userId: string, file: File) {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/avatar.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

export function profileToDisplay(profile: Profile | null, fallbackEmail?: string) {
  return profile?.display_name ?? fallbackEmail?.split('@')[0] ?? 'Guest'
}
