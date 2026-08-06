export interface Room {
  id: string
  room_code: string
  host_id: string | null
  title: string | null
  created_at: string
  is_active: boolean
  waiting_room_enabled?: boolean
  passcode?: string | null
  is_persistent?: boolean
  scheduled_at?: string | null
  ended_at?: string | null
  workspace_id?: string | null
}

export interface Participant {
  id: string
  room_id: string
  user_id: string | null
  display_name: string | null
  joined_at: string
  left_at: string | null
  approved: boolean
}

export interface ChatMessage {
  id: string
  room_id: string
  user_id: string | null
  display_name: string | null
  message: string
  created_at: string
  attachment_path?: string | null
  attachment_name?: string | null
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  updated_at: string
}

export interface RoomNote {
  id: string
  room_id: string
  author_id: string | null
  body: string
  created_at: string
  updated_at: string
}

export interface Poll {
  id: string
  room_id: string
  created_by: string | null
  question: string
  options: string[]
  closed_at: string | null
  created_at: string
}

export interface PollVote {
  id: string
  poll_id: string
  user_id: string
  option_index: number
  created_at: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  owner_id: string | null
  created_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: 'owner' | 'member'
  created_at: string
}

export interface UserProfile {
  id: string
  email?: string
  displayName: string
  avatarUrl?: string | null
}
