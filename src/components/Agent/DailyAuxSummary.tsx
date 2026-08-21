import React, { useState, useEffect } from 'react'
import { ActualAuxEvent, AuxMaster, Schedule, ScheduleActivity } from '@/types'
import { supabase } from '@/services/supabase'
import { formatDurationMinutes, calculateDuration, formatDisplayTime } from '@/utils/timeUtils'
import { Clock, Calendar, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface DailyAuxSummaryProps {
  agentId: string
  scheduleDate: string
}

interface SummaryItem {
  aux: AuxMaster
  totalDuration: number
  instances: number
  plannedDuration: number
}

const DailyAuxSummary: React.FC<DailyAuxSummaryProps> = ({ agentId, scheduleDate }) => {
  const [summary, setSummary] = useState<SummaryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalWorkingMinutes, setTotalWorkingMinutes] = useState(0)

  useEffect(() => {
    fetchDailySummary()
  }, [agentId, scheduleDate])

  const fetchDailySummary = async () => {
    try {
      setIsLoading(true)

      // Fetch actual AUX events for the day
      const { data: actualEvents, error: actualError } = await supabase
        .from('actual_aux_events')
        .select('*')
        .eq('agent_id', agentId)
        .gte('actual_start', `${scheduleDate}T00:00:00`)
        .lt('actual_start', `${scheduleDate}T23:59:59`)

      if (actualError) throw actualError

      // Fetch planned activities
      const { data: schedule, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('agent_id', agentId)
        .eq('schedule_date', scheduleDate)
        .single()

      if (scheduleError && scheduleError.code !== 'PGRST116') throw scheduleError

      const { data: plannedActivities, error: activitiesError } = await supabase
        .from('schedule_activities')
        .select('*, aux_master(*)')
        .eq('agent_id', agentId)

      if (activitiesError) throw activitiesError

      // Fetch AUX master
      const { data: auxMaster, error: auxError } = await supabase
        .from('aux_master')
        .select('*')

      if (auxError) throw auxError

      // Calculate summary
      const auxMap = new Map(auxMaster?.map((aux) => [aux.id, aux]) || [])
      const summaryMap = new Map<string, SummaryItem>()

      // Process actual events
      actualEvents?.forEach((event) => {
        const aux = auxMap.get(event.aux_id)
        if (!aux) return

        const key = aux.id
        const existing = summaryMap.get(key) || {
          aux,
          totalDuration: 0,
          instances: 0,
          plannedDuration: 0,
        }

        if (event.duration_seconds) {
          existing.totalDuration += Math.floor(event.duration_seconds / 60)
          existing.instances += 1
        }

        summaryMap.set(key, existing)
      })

      // Add planned durations
      plannedActivities?.forEach((activity) => {
        const key = activity.aux_id
        const existing = summaryMap.get(key) || {
          aux: auxMap.get(activity.aux_id),
          totalDuration: 0,
          instances: 0,
          plannedDuration: 0,
        }

        const plannedDuration = calculateDuration(activity.planned_start, activity.planned_end)
        existing.plannedDuration += plannedDuration

        summaryMap.set(key, existing)
      })

      setSummary(Array.from(summaryMap.values()))

      // Calculate total working minutes
      if (schedule) {
        const totalMinutes = calculateDuration(schedule.shift_start, schedule.shift_end)
        setTotalWorkingMinutes(totalMinutes)
      }
    } catch (error: any) {
      console.error('Failed to fetch daily summary:', error)
      toast.error('Failed to load daily summary')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">Today's Summary</h3>
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-center py-4">Loading...</p>
      ) : summary.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No activities recorded yet</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {summary.map((item) => (
            <div
              key={item.aux.id}
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: item.aux.color + '10',
                borderColor: item.aux.color,
              }}
            >
              <p className="text-xs font-semibold text-gray-600 mb-2">{item.aux.name}</p>
              <p className="text-lg font-bold mb-1" style={{ color: item.aux.color }}>
                {formatDurationMinutes(item.totalDuration)}
              </p>
              <p className="text-xs text-gray-500">
                {item.instances} instance{item.instances !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      )}

      {totalWorkingMinutes > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Working Time:</span>
            <span className="font-semibold text-gray-900">{formatDurationMinutes(totalWorkingMinutes)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default DailyAuxSummary
