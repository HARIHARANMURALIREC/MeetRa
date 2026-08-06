import type { Participant } from 'livekit-client'
import { ConnectionQuality } from 'livekit-client'

interface ConnectionQualityIndicatorProps {
  participant: Participant
}

const qualityLabels: Record<ConnectionQuality, string> = {
  [ConnectionQuality.Excellent]: 'Excellent',
  [ConnectionQuality.Good]: 'Good',
  [ConnectionQuality.Poor]: 'Poor',
  [ConnectionQuality.Lost]: 'Lost',
  [ConnectionQuality.Unknown]: 'Unknown',
}

function barsForQuality(quality: ConnectionQuality): number {
  switch (quality) {
    case ConnectionQuality.Excellent:
      return 4
    case ConnectionQuality.Good:
      return 3
    case ConnectionQuality.Poor:
      return 2
    case ConnectionQuality.Lost:
      return 1
    default:
      return 0
  }
}

export function ConnectionQualityIndicator({ participant }: ConnectionQualityIndicatorProps) {
  const quality = participant.connectionQuality ?? ConnectionQuality.Unknown
  const bars = barsForQuality(quality)
  const label = qualityLabels[quality]

  return (
    <span className="flex items-end gap-0.5" title={`Connection: ${label}`}>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`w-0.5 rounded-sm ${
            i <= bars ? 'bg-[var(--meetra-success)]' : 'bg-[var(--meetra-muted)]/40'
          }`}
          style={{ height: `${i * 3 + 2}px` }}
        />
      ))}
    </span>
  )
}
