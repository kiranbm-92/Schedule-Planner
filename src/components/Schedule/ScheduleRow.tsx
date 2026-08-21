import React from 'react'
import { User, Schedule, ScheduleActivity, AuxMaster } from '@/types'
import AuxBlock from './AuxBlock'
import { getAllTimeSlots, timeToSlot } from '@/utils/timeUtils'

interface ScheduleRowProps {
  agent: User
  schedule: Schedule | null
  activities: ScheduleActivity[]
  auxMasterMap: Record<string, AuxMaster>
  isEditable: boolean
  onEditActivity?: (activity: ScheduleActivity) => void
  onDeleteActivity?: (id: string) => void
  onCopyActivity?: (activity: ScheduleActivity) => void
  onSelectSlot?: (time: string) => void
}

const ScheduleRow: React.FC<ScheduleRowProps> = ({
  agent,
  schedule,
  activities,
  auxMasterMap,
  isEditable,
  onEditActivity,
  onDeleteActivity,
  onCopyActivity,
  onSelectSlot,
}) => {
  const timeSlots = getAllTimeSlots()

  // Group activities by time slot
  const activitiesBySlot = activities.reduce(
    (acc, activity) => {
      const startSlot = timeToSlot(activity.planned_start)
      for (let i = startSlot; i < timeToSlot(activity.planned_end); i++) {
        if (!acc[i]) acc[i] = []
        acc[i].push(activity)
      }
      return acc
    },
    {} as Record<number, ScheduleActivity[]>
  )

  return (
    <div className="flex border-b border-gray-200 hover:bg-blue-50 transition">
      {/* Frozen Agent Information */}
      <div className="w-80 px-4 py-3 border-r border-gray-200 flex-shrink-0 bg-white hover:bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
            {agent.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900">{agent.name}</p>
            <p className="text-xs text-gray-500">{agent.employee_id}</p>
          </div>
        </div>
        <div className="mt-2 space-y-1 text-xs text-gray-600">
          <p>Agency: {agent.agency_id ? 'N/A' : '-'}</p>
          <p>Queue: {agent.queue_id ? 'N/A' : '-'}</p>
          {schedule && <p className="font-semibold">Shift: {schedule.shift_start} - {schedule.shift_end}</p>}
        </div>
      </div>

      {/* Timeline Activities */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex" style={{ minWidth: '100%' }}>
          {timeSlots.map((time, index) => {
            const slotActivities = activitiesBySlot[index] || []
            return (
              <div
                key={time}
                onClick={() => onSelectSlot?.(time)}
                className="border-r border-gray-200 px-1 py-3 cursor-pointer hover:bg-yellow-100 transition"
                style={{ width: '40px', minHeight: '80px' }}
              >
                {slotActivities.length > 0 && slotActivities[0] && (
                  <AuxBlock
                    activity={slotActivities[0]}
                    auxMaster={auxMasterMap[slotActivities[0].aux_id] || { color: '#ccc' } as any}
                    isEditable={isEditable}
                    onEdit={onEditActivity}
                    onDelete={onDeleteActivity}
                    onCopy={onCopyActivity}
                    containerWidth={40}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ScheduleRow
