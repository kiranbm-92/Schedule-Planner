import React, { useState, useEffect } from 'react'
import { User, LoginSession, ActualAuxEvent, AuxMaster } from '@/types'
import { supabase } from '@/services/supabase'
import { formatDurationSeconds, formatDisplayTime } from '@/utils/timeUtils'
import { Activity, Clock, User as UserIcon } from 'lucide-react'
import toast from 'react-hot-toast'

interface AgentStatus {
  agent: User
  currentAux: AuxMaster | null
  elapsedSeconds: number
  loginTime: string
  status: 'online' | 'offline'
}

const RealtimeDashboard: React.FC = () => {
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<AgentStatus | null>(null)

  useEffect(() => {
    fetchRealtimeData()
    const interval = setInterval(() => fetchRealtimeData(), 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchRealtimeData = async () => {
    try {
      // Fetch all active login sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('login_sessions')
        .select('*')
        .eq('status', 'active')
        .order('login_time', { ascending: false })

      if (sessionsError) throw sessionsError

      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'agent')

      if (usersError) throw usersError

      // Fetch all active AUX events
      const { data: auxEvents, error: auxEventsError } = await supabase
        .from('actual_aux_events')
        .select('*')
        .is('actual_end', null)

      if (auxEventsError) throw auxEventsError

      // Fetch AUX master
      const { data: auxMaster, error: auxError } = await supabase
        .from('aux_master')
        .select('*')

      if (auxError) throw auxError

      const auxMap = new Map(auxMaster?.map((a) => [a.id, a]) || [])
      const sessionMap = new Map(sessions?.map((s) => [s.agent_id, s]) || [])
      const auxEventMap = new Map(auxEvents?.map((e) => [e.agent_id, e]) || [])

      const now = new Date()
      const statuses = users?.map((user) => {
        const session = sessionMap.get(user.id)
        const auxEvent = auxEventMap.get(user.id)
        const elapsedSeconds = auxEvent
          ? Math.floor((now.getTime() - new Date(auxEvent.actual_start).getTime()) / 1000)
          : 0

        return {
          agent: user,
          currentAux: auxEvent ? auxMap.get(auxEvent.aux_id) || null : null,
          elapsedSeconds,
          loginTime: session?.login_time || '',
          status: session ? 'online' : 'offline',
        }
      }) || []

      setAgentStatuses(statuses)
    } catch (error: any) {
      console.error('Failed to fetch realtime data:', error)
      toast.error('Failed to load realtime data')
    } finally {
      setIsLoading(false)
    }
  }

  const onlineAgents = agentStatuses.filter((s) => s.status === 'online')
  const offlineAgents = agentStatuses.filter((s) => s.status === 'offline')

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Real-Time Agent Monitoring</h1>
      <p className="text-gray-600 mb-8">Live status of all agents and their current activities</p>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Online Agents</p>
          <p className="text-3xl font-bold text-gray-900">{onlineAgents.length}</p>
          <p className="text-xs text-gray-500 mt-2">
            {agentStatuses.length > 0
              ? Math.round((onlineAgents.length / agentStatuses.length) * 100)
              : 0}% of total
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">Offline Agents</p>
          <p className="text-3xl font-bold text-gray-900">{offlineAgents.length}</p>
          <p className="text-xs text-gray-500 mt-2">Currently inactive</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 mb-1">Total Agents</p>
          <p className="text-3xl font-bold text-gray-900">{agentStatuses.length}</p>
          <p className="text-xs text-gray-500 mt-2">In system</p>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-gray-500">Loading agents...</div>
        ) : agentStatuses.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">No agents found</div>
        ) : (
          agentStatuses.map((status) => (
            <div
              key={status.agent.id}
              onClick={() => setSelectedAgent(status)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer p-4 border-l-4"
              style={{
                borderColor: status.currentAux?.color || '#ccc',
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                    {status.agent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{status.agent.name}</p>
                    <p className="text-xs text-gray-500">{status.agent.employee_id}</p>
                  </div>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    status.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
              </div>

              {status.currentAux && (
                <div
                  className="p-3 rounded-lg mb-3 text-white text-center"
                  style={{ backgroundColor: status.currentAux.color }}
                >
                  <p className="text-sm font-semibold">{status.currentAux.name}</p>
                  <p className="text-xs mt-1">{formatDurationSeconds(status.elapsedSeconds)}</p>
                </div>
              )}

              <div className="text-xs text-gray-600 space-y-1">
                <p>Login: {status.loginTime ? formatDisplayTime(new Date(status.loginTime)) : 'N/A'}</p>
                <p className="font-semibold text-gray-900 mt-2">
                  {status.status === 'online' ? '✓ Online' : '✗ Offline'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{selectedAgent.agent.name}</h2>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Employee ID</p>
                <p className="text-lg font-semibold text-gray-900">{selectedAgent.agent.employee_id}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p
                  className={`text-lg font-semibold ${
                    selectedAgent.status === 'online' ? 'text-green-600' : 'text-gray-600'
                  }`}
                >
                  {selectedAgent.status === 'online' ? '🟢 Online' : '🔴 Offline'}
                </p>
              </div>

              {selectedAgent.currentAux && (
                <div>
                  <p className="text-sm text-gray-600">Current AUX</p>
                  <div
                    className="p-3 rounded-lg text-white text-center mt-2"
                    style={{ backgroundColor: selectedAgent.currentAux.color }}
                  >
                    <p className="font-semibold">{selectedAgent.currentAux.name}</p>
                    <p className="text-sm mt-1">{formatDurationSeconds(selectedAgent.elapsedSeconds)}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Login Time</p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedAgent.loginTime ? formatDisplayTime(new Date(selectedAgent.loginTime)) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RealtimeDashboard
