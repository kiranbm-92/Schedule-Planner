import React, { useState, useEffect } from 'react'
import { formatDisplayTime, formatDurationSeconds, getCurrentTimeSlot } from '@/utils/timeUtils'
import { Clock, Activity } from 'lucide-react'

interface LiveTimerProps {
  startTime: Date
  auxName: string
  auxColor: string
  plannedStart?: string
  plannedEnd?: string
}

const LiveTimer: React.FC<LiveTimerProps> = ({
  startTime,
  auxName,
  auxColor,
  plannedStart,
  plannedEnd,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
      setElapsedSeconds(elapsed)
    }, 1000)

    return () => clearInterval(timer)
  }, [startTime])

  return (
    <div className="bg-white rounded-lg border-2 p-6 text-center" style={{ borderColor: auxColor }}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <Activity className="w-5 h-5" style={{ color: auxColor }} />
        <h3 className="text-sm font-semibold text-gray-600">CURRENT STATUS</h3>
      </div>

      <div className="text-3xl font-bold mb-4" style={{ color: auxColor }}>
        {auxName.toUpperCase()}
      </div>

      <div className="flex items-center justify-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-gray-600" />
        <div className="text-2xl font-mono font-bold text-gray-900">
          {formatDurationSeconds(elapsedSeconds)}
        </div>
      </div>

      <div className="text-xs text-gray-600 space-y-1">
        <p>Started: {formatDisplayTime(startTime)}</p>
        {plannedStart && plannedEnd && (
          <>
            <p className="text-gray-500 mt-2">Scheduled: {plannedStart} - {plannedEnd}</p>
          </>
        )}
        <p className="text-gray-400 mt-2">Current: {formatDisplayTime(currentTime)}</p>
      </div>
    </div>
  )
}

export default LiveTimer
