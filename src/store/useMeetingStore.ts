import { create } from 'zustand'
import type { Participant, Room, UserProfile, Workspace } from '../types'

interface MeetingState {
  user: UserProfile | null
  room: Room | null
  participant: Participant | null
  displayName: string
  isHost: boolean
  isApproved: boolean
  micEnabled: boolean
  cameraEnabled: boolean
  noiseSuppressionEnabled: boolean
  audioDeviceId: string
  videoDeviceId: string
  cameraFacing: 'user' | 'environment'
  chatOpen: boolean
  participantsOpen: boolean
  pollsOpen: boolean
  whiteboardOpen: boolean
  hasLeft: boolean
  meetingEnded: boolean
  activeWorkspace: Workspace | null
  setUser: (user: UserProfile | null) => void
  setRoom: (room: Room | null) => void
  setParticipant: (participant: Participant | null) => void
  setDisplayName: (name: string) => void
  setIsHost: (isHost: boolean) => void
  setIsApproved: (approved: boolean) => void
  setMicEnabled: (enabled: boolean) => void
  setCameraEnabled: (enabled: boolean) => void
  setNoiseSuppressionEnabled: (enabled: boolean) => void
  setAudioDeviceId: (id: string) => void
  setVideoDeviceId: (id: string) => void
  setCameraFacing: (facing: 'user' | 'environment') => void
  setChatOpen: (open: boolean) => void
  setParticipantsOpen: (open: boolean) => void
  setPollsOpen: (open: boolean) => void
  setWhiteboardOpen: (open: boolean) => void
  setHasLeft: (left: boolean) => void
  setMeetingEnded: (ended: boolean) => void
  setActiveWorkspace: (workspace: Workspace | null) => void
  reset: () => void
}

const initialState = {
  user: null as UserProfile | null,
  room: null as Room | null,
  participant: null as Participant | null,
  displayName: '',
  isHost: false,
  isApproved: false,
  micEnabled: true,
  cameraEnabled: true,
  noiseSuppressionEnabled: false,
  audioDeviceId: '',
  videoDeviceId: '',
  cameraFacing: 'user' as const,
  chatOpen: false,
  participantsOpen: false,
  pollsOpen: false,
  whiteboardOpen: false,
  hasLeft: false,
  meetingEnded: false,
  activeWorkspace: null as Workspace | null,
}

export const useMeetingStore = create<MeetingState>((set) => ({
  ...initialState,
  setUser: (user) =>
    set((state) => {
      if (
        state.user?.id === user?.id &&
        state.user?.email === user?.email &&
        state.user?.displayName === user?.displayName &&
        state.user?.avatarUrl === user?.avatarUrl
      ) {
        return state
      }
      return { user }
    }),
  setRoom: (room) => set({ room }),
  setParticipant: (participant) => set({ participant }),
  setDisplayName: (displayName) => set({ displayName }),
  setIsHost: (isHost) => set({ isHost }),
  setIsApproved: (approved) => set({ isApproved: approved }),
  setMicEnabled: (micEnabled) => set({ micEnabled }),
  setCameraEnabled: (cameraEnabled) => set({ cameraEnabled }),
  setNoiseSuppressionEnabled: (noiseSuppressionEnabled) => set({ noiseSuppressionEnabled }),
  setAudioDeviceId: (audioDeviceId) => set({ audioDeviceId }),
  setVideoDeviceId: (videoDeviceId) => set({ videoDeviceId }),
  setCameraFacing: (cameraFacing) => set({ cameraFacing }),
  setChatOpen: (chatOpen) =>
    set(
      chatOpen
        ? { chatOpen, participantsOpen: false, pollsOpen: false, whiteboardOpen: false }
        : { chatOpen },
    ),
  setParticipantsOpen: (participantsOpen) =>
    set(
      participantsOpen
        ? { participantsOpen, chatOpen: false, pollsOpen: false, whiteboardOpen: false }
        : { participantsOpen },
    ),
  setPollsOpen: (pollsOpen) =>
    set(
      pollsOpen
        ? { pollsOpen, chatOpen: false, participantsOpen: false, whiteboardOpen: false }
        : { pollsOpen },
    ),
  setWhiteboardOpen: (whiteboardOpen) =>
    set(
      whiteboardOpen
        ? { whiteboardOpen, chatOpen: false, participantsOpen: false, pollsOpen: false }
        : { whiteboardOpen },
    ),
  setHasLeft: (hasLeft) => set({ hasLeft }),
  setMeetingEnded: (meetingEnded) => set({ meetingEnded }),
  setActiveWorkspace: (activeWorkspace) => set({ activeWorkspace }),
  reset: () => set(initialState),
}))
