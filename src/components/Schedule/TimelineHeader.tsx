import React, { useState, useEffect } from 'react'
import { getAllTimeSlots, slotToTime, SLOTS_PER_HOUR } from '@/utils/timeUtils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TimelineHeaderProps {
  scrollContainerRef: React.RefObject<HTMLDivElement>
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({ scrollContainerRef }) => {
  const [scrollPosition, setScrollPosition] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        setScrollPosition(scrollContainerRef.current.scrollLeft)
      }
    }

    const container = scrollContainerRef.current
    container?.addEventListener('scroll', handleScroll)
    return () => container?.removeEventListener('scroll', handleScroll)
  }, [scrollContainerRef])

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const timeSlots = getAllTimeSlots()
  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
      <div className="flex items-center h-24">
        {/* Frozen Columns Header */}
        <div className="w-80 border-r border-gray-200 px-4 py-2 bg-gray-50 flex-shrink-0">
          <div className="text-sm font-semibold text-gray-700">Agent Information</div>
        </div>

        {/* Scrollable Timeline Header */}
        <div className="flex-1 overflow-hidden relative">
          <div className="flex items-center justify-between px-2 mb-2">
            <button
              onClick={() => handleScroll('left')}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-600">24-Hour Timeline (15-min intervals)</span>
            <button
              onClick={() => handleScroll('right')}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Hour labels */}
          <div className="overflow-x-hidden" ref={scrollContainerRef}>
            <div className="flex" style={{ minWidth: '100%' }}>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-r border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-50"
                  style={{ width: `${SLOTS_PER_HOUR * 40}px` }}
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* 15-minute interval lines */}
          <div className="overflow-x-hidden bg-white border-t border-gray-200" ref={scrollContainerRef}>
            <div className="flex" style={{ minWidth: '100%' }}>
              {timeSlots.map((time, index) => {
                const isHourStart = index % SLOTS_PER_HOUR === 0
                return (
                  <div
                    key={time}
                    className={`border-r ${
                      isHourStart ? 'border-gray-400 font-semibold' : 'border-gray-200'
                    } px-0.5 py-1 text-xs text-gray-600 text-center bg-white`}
                    style={{ width: '40px' }}
                  >
                    {isHourStart ? time : ''}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimelineHeader
