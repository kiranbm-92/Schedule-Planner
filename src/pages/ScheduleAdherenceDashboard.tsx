import React, { useState, useEffect } from 'react'
import { supabase } from '@/services/supabase'
import { Schedule, User, AuxMaster } from '@/types'
import { calculateDuration, formatDurationMinutes } from '@/utils/timeUtils'
import { Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface ScheduleAdherence {
  agent: User
  schedule: Schedule | null
  adherencePercentage: number
  plannedMinutes: number
  actualMinutes: number
  status: 'on-track' | 'at-risk' | 'offline'
}

const ScheduleAdherenceDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [adherenceData, setAdherenceData] = useState<ScheduleAdherence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterRole, setFilterRole] = useState<string>('all')

  useEffect(() => {
    fetchAdherenceData()
  }, [selectedDate])

  const fetchAdherenceData = async () => {
    try {
      setIsLoading(true)

      // Fetch all agents
      const { data: agents, error: agentsError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'agent')

      if (agentsError) throw agentsError

      // Fetch schedules
      const { data: schedules, error: schedulesError } = await supabase
        .from('schedules')
        .select('*')
        .eq('schedule_date', selectedDate)

      if (schedulesError) throw schedulesError

      // Fetch actual AUX events
      const { data: auxEvents, error: auxEventsError } = await supabase
        .from('actual_aux_events')
        .select('*')
        .gte('actual_start', `${selectedDate}T00:00:00`)
        .lt('actual_start', `${selectedDate}T23:59:59`)

      if (auxEventsError) throw auxEventsError

      // Fetch AUX master
      const { data: auxMaster, error: auxError } = await supabase
        .from('aux_master')
        .select('*')

      if (auxError) throw auxError

      // Calculate adherence for each agent
      const scheduleMap = new Map(schedules?.map((s) => [s.agent_id, s]) || [])
      const auxMap = new Map(auxMaster?.map((a) => [a.id, a]) || [])

      const adherenceMap = new Map<string, { productive: number; total: number }>()

      auxEvents?.forEach((event) => {
        const aux = auxMap.get(event.aux_id)
        if (!aux) return

        const key = event.agent_id
        const existing = adherenceMap.get(key) || { productive: 0, total: 0 }

        if (event.duration_seconds) {
          const durationMinutes = Math.floor(event.duration_seconds / 60)
          existing.total += durationMinutes

          if (aux.counts_as_productive) {
            existing.productive += durationMinutes
          }
        }

        adherenceMap.set(key, existing)
      })

      const adherenceList = agents?.map((agent) => {
        const schedule = scheduleMap.get(agent.id)
        const adherence = adherenceMap.get(agent.id) || { productive: 0, total: 0 }
        const plannedMinutes = schedule
          ? calculateDuration(schedule.shift_start, schedule.shift_end)
          : 0

        const adherencePercentage =
          plannedMinutes > 0 ? Math.round((adherence.productive / plannedMinutes) * 100) : 0

        let status: 'on-track' | 'at-risk' | 'offline' = 'offline'
        if (schedule) {
          if (adherencePercentage >= 90) {
            status = 'on-track'
          } else if (adherencePercentage >= 70) {
            status = 'at-risk'
          }
        }

        return {
          agent,
          schedule,
          adherencePercentage,
          plannedMinutes,
          actualMinutes: adherence.productive,
          status,
        }
      }) || []

      setAdherenceData(adherenceList)
    } catch (error: any) {
      console.error('Failed to fetch adherence data:', error)
      toast.error('Failed to load adherence data')
    } finally {
      setIsLoading(false)
    }
  }

  const onTrackCount = adherenceData.filter((a) => a.status === 'on-track').length
  const atRiskCount = adherenceData.filter((a) => a.status === 'at-risk').length
  const offlineCount = adherenceData.filter((a) => a.status === 'offline').length

  const filteredData = adherenceData.filter((item) => {
    if (filterRole === 'on-track') return item.status === 'on-track'
    if (filterRole === 'at-risk') return item.status === 'at-risk'
    if (filterRole === 'offline') return item.status === 'offline'
    return true
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule Adherence Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor agent compliance with scheduled shift activities</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">On Track</p>
              <p className="text-3xl font-bold text-gray-900">{onTrackCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">At Risk</p>
              <p className="text-3xl font-bold text-gray-900">{atRiskCount}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Offline</p>
              <p className="text-3xl font-bold text-gray-900">{offlineCount}</p>
            </div>
            <Clock className="w-8 h-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterRole('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filterRole === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All ({adherenceData.length})
          </button>
          <button
            onClick={() => setFilterRole('on-track')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filterRole === 'on-track'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            On Track ({onTrackCount})
          </button>
          <button
            onClick={() => setFilterRole('at-risk')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filterRole === 'at-risk'
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            At Risk ({atRiskCount})
          </button>
          <button
            onClick={() => setFilterRole('offline')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filterRole === 'offline'
                ? 'bg-gray-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Offline ({offlineCount})
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading data...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Agent</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Adherence %</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Planned</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actual</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.agent.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                          {item.agent.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{item.agent.name}</p>
                          <p className="text-xs text-gray-500">{item.agent.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {item.status === 'on-track' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          <CheckCircle className="w-3 h-3" /> On Track
                        </span>
                      )}
                      {item.status === 'at-risk' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                          <AlertCircle className="w-3 h-3" /> At Risk
                        </span>
                      )}
                      {item.status === 'offline' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                          <Clock className="w-3 h-3" /> Offline
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              item.adherencePercentage >= 90
                                ? 'bg-green-500'
                                : item.adherencePercentage >= 70
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(item.adherencePercentage, 100)}%` }}
                          />
                        </div>
                        <span className="font-semibold text-gray-900 w-12 text-right">{item.adherencePercentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      {formatDurationMinutes(item.plannedMinutes)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 font-semibold">
                      {formatDurationMinutes(item.actualMinutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduleAdherenceDashboard
