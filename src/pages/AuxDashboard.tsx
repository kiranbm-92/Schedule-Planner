import React, { useState, useEffect } from 'react'
import { AuxMaster, ActualAuxEvent, Schedule } from '@/types'
import { supabase } from '@/services/supabase'
import { formatDurationMinutes, formatDisplayDate } from '@/utils/timeUtils'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Calendar, TrendingUp, Clock, Activity } from 'lucide-react'
import toast from 'react-hot-toast'

interface AuxStats {
  auxCode: string
  auxName: string
  totalDuration: number
  instances: number
  color: string
}

interface AgentProductivity {
  agentName: string
  productive: number
  nonProductive: number
  available: number
}

const AuxDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [auxStats, setAuxStats] = useState<AuxStats[]>([])
  const [agentProductivity, setAgentProductivity] = useState<AgentProductivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalWorkingMinutes, setTotalWorkingMinutes] = useState(0)
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    fetchAuxData()
  }, [selectedDate])

  const fetchAuxData = async () => {
    try {
      setIsLoading(true)

      // Fetch actual AUX events for the date
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

      // Fetch schedules
      const { data: schedules, error: schedulesError } = await supabase
        .from('schedules')
        .select('*')
        .eq('schedule_date', selectedDate)

      if (schedulesError) throw schedulesError

      // Calculate AUX statistics
      const auxMap = new Map(auxMaster?.map((a) => [a.id, a]) || [])
      const statsMap = new Map<string, AuxStats>()

      auxEvents?.forEach((event) => {
        const aux = auxMap.get(event.aux_id)
        if (!aux) return

        const key = aux.id
        const existing = statsMap.get(key) || {
          auxCode: aux.code,
          auxName: aux.name,
          totalDuration: 0,
          instances: 0,
          color: aux.color,
        }

        if (event.duration_seconds) {
          existing.totalDuration += Math.floor(event.duration_seconds / 60)
          existing.instances += 1
        }

        statsMap.set(key, existing)
      })

      const stats = Array.from(statsMap.values()).sort((a, b) => b.totalDuration - a.totalDuration)
      setAuxStats(stats)

      // Calculate total working minutes
      let totalMinutes = 0
      schedules?.forEach((schedule) => {
        const [startHour, startMin] = schedule.shift_start.split(':').map(Number)
        const [endHour, endMin] = schedule.shift_end.split(':').map(Number)
        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin
        totalMinutes += endMinutes - startMinutes
      })
      setTotalWorkingMinutes(totalMinutes)

      // Prepare chart data
      const chartData = stats.map((stat) => ({
        name: stat.auxCode,
        duration: stat.totalDuration,
        instances: stat.instances,
      }))
      setChartData(chartData)
    } catch (error: any) {
      console.error('Failed to fetch AUX data:', error)
      toast.error('Failed to load AUX data')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AUX Reporting Dashboard</h1>
          <p className="text-gray-600 mt-2">Analyze agent activities and productivity metrics</p>
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

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading data...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total AUX Events</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {auxStats.reduce((sum, s) => sum + s.instances, 0)}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total AUX Duration</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatDurationMinutes(auxStats.reduce((sum, s) => sum + s.totalDuration, 0))}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Working Time</p>
                  <p className="text-3xl font-bold text-gray-900">{formatDurationMinutes(totalWorkingMinutes)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Duration</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {auxStats.length > 0
                      ? formatDurationMinutes(
                          Math.floor(
                            auxStats.reduce((sum, s) => sum + s.totalDuration, 0) /
                              auxStats.reduce((sum, s) => sum + s.instances, 0)
                          )
                        )
                      : '0m'}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Bar Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">AUX Duration by Code</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="duration" fill="#3B82F6" name="Duration (mins)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">AUX Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="duration"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {auxStats.map((stat, index) => (
                      <Cell key={`cell-${index}`} fill={stat.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Detailed AUX Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">AUX Code</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">AUX Name</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Instances</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Total Duration</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Avg Duration</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">% of Day</th>
                  </tr>
                </thead>
                <tbody>
                  {auxStats.map((stat) => {
                    const percentage =
                      totalWorkingMinutes > 0 ? ((stat.totalDuration / totalWorkingMinutes) * 100).toFixed(1) : '0'
                    const avgDuration =
                      stat.instances > 0 ? Math.floor(stat.totalDuration / stat.instances) : 0

                    return (
                      <tr key={stat.auxCode} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm font-mono font-bold">
                          <span
                            className="px-3 py-1 rounded text-white"
                            style={{ backgroundColor: stat.color }}
                          >
                            {stat.auxCode}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{stat.auxName}</td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900 font-semibold">
                          {stat.instances}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900 font-semibold">
                          {formatDurationMinutes(stat.totalDuration)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900">
                          {formatDurationMinutes(avgDuration)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900 font-semibold">{percentage}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AuxDashboard
