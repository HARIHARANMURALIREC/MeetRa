import { createContext, useContext } from 'react'

export const DominantSpeakerContext = createContext<string | null>(null)

export function useDominantSpeakerId() {
  return useContext(DominantSpeakerContext)
}
