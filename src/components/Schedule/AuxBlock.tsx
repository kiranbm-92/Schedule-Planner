import React from 'react'
import { Schedule, ScheduleActivity, AuxMaster } from '@/types'
import { calculateDuration, formatDurationMinutes } from '@/utils/timeUtils'
import { Trash2, Copy, Edit2 } from 'lucide-react'

interface AuxBlockProps {
  activity: ScheduleActivity
  auxMaster: AuxMaster
  isEditable: boolean
  onEdit?: (activity: ScheduleActivity) => void
  onDelete?: (id: string) => void
  onCopy?: (activity: ScheduleActivity) => void
  containerWidth: number
}

const AuxBlock: React.FC<AuxBlockProps> = ({
  activity,
  auxMaster,
  isEditable,
  onEdit,
  onDelete,
  onCopy,
  containerWidth,
}) => {
  const duration = calculateDuration(activity.planned_start, activity.planned_end)
  const durationLabel = formatDurationMinutes(duration)

  return (
    <div
      className="group relative px-2 py-1 rounded text-white text-xs font-semibold shadow-sm hover:shadow-md transition"
      style={{
        backgroundColor: auxMaster.color,
        minWidth: `${Math.max((duration / 15) * 40, 40)}px`,
      }}
      title={`${auxMaster.name}: ${activity.planned_start} - ${activity.planned_end} (${durationLabel})`}
    >
      <div className="truncate">{auxMaster.short_name}</div>
      <div className="truncate text-xs opacity-90">{durationLabel}</div>

      {/* Context Menu on Hover */}
      {isEditable && (
        <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-300 rounded shadow-lg opacity-0 group-hover:opacity-100 transition z-50 min-w-max">
          <button
            onClick={() => onEdit?.(activity)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-200"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={() => onCopy?.(activity)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-200"
          >
            <Copy className="w-3 h-3" />
            Copy
          </button>
          <button
            onClick={() => onDelete?.(activity.id)}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default AuxBlock
