import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/services/supabase'
import { Schedule, ScheduleActivity, AuxMaster, ActualAuxEvent, LoginSession } from '@/types'
import { formatDisplayDate, formatDisplayTime, calculateDuration, formatDurationMinutes } from '@/utils/timeUtils'
import { Loader, LogOut } from 'lucide-react'
import Header from '@/components/Header'
import LiveTimer from '@/components/Agent/LiveTimer'
import DailyAuxSummary from '@/components/Agent/DailyAuxSummary'
import AuxSelector from '@/components/Agent/AuxSelector'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const AgentPortal: React.FC = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [currentDate] = useState(new Date())
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [activities, setActivities] = useState<ScheduleActivity[]>([])
  const [auxMaster, setAuxMaster] = useState<AuxMaster[]>([])
  const [currentAux, setCurrentAux] = useState<ActualAuxEvent | null>(null)
  const [currentAuxMaster, setCurrentAuxMaster] = useState<AuxMaster | null>(null)
  const [loginSession, setLoginSession] = useState<LoginSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isChangingAux, setIsChangingAux] = useState(false)

  useEffect(() => {
    if (!user?.id || user.role !== 'agent') {
      navigate('/login')
      return
    }

    fetchAgentData()
    const interval = setInterval(() => fetchAgentData(), 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [user?.id])

  const fetchAgentData = async () => {
    if (!user?.id) return

    try {
      const today = currentDate.toISOString().split('T')[0]

      // Fetch schedule
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('agent_id', user.id)
        .eq('schedule_date', today)
        .single()

      if (scheduleError && scheduleError.code !== 'PGRST116') throw scheduleError
      setSchedule(scheduleData || null)

      // Fetch planned activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('schedule_activities')
        .select('*')
        .eq('agent_id', user.id)

      if (activitiesError) throw activitiesError
      setActivities(activitiesData || [])

      // Fetch AUX master
      const { data: auxData, error: auxError } = await supabase
        .from('aux_master')
        .select('*')
        .eq('active', true)

      if (auxError) throw auxError
      setAuxMaster(auxData || [])

      // Fetch current active AUX event
      const { data: currentAuxData, error: currentAuxError } = await supabase
        .from('actual_aux_events')
        .select('*')
        .eq('agent_id', user.id)
        .is('actual_end', null)
        .order('actual_start', { ascending: false })
        .limit(1)
        .single()

      if (currentAuxError && currentAuxError.code !== 'PGRST116') throw currentAuxError

      if (currentAuxData) {
        setCurrentAux(currentAuxData)
        const auxInfo = auxData?.find((a) => a.id === currentAuxData.aux_id)
        setCurrentAuxMaster(auxInfo || null)
      }

      // Fetch active login session
      const { data: sessionData, error: sessionError } = await supabase
        .from('login_sessions')
        .select('*')
        .eq('agent_id', user.id)
        .eq('status', 'active')
        .order('login_time', { ascending: false })
        .limit(1)
        .single()

      if (sessionError && sessionError.code !== 'PGRST116') throw sessionError
      setLoginSession(sessionData || null)
    } catch (error: any) {
      console.error('Failed to fetch agent data:', error)
      if (!isLoading) toast.error('Failed to refresh data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAuxChange = async (auxId: string) => {
    if (!user?.id || !loginSession?.id) {
      toast.error('Session not found')
      return
    }

    try {
      setIsChangingAux(true)

      // Close current AUX event if exists
      if (currentAux?.id) {
        const now = new Date().toISOString()
        const durationSeconds = Math.floor(
          (new Date(now).getTime() - new Date(currentAux.actual_start).getTime()) / 1000
        )

        const { error: updateError } = await supabase
          .from('actual_aux_events')
          .update({
            actual_end: now,
            duration_seconds: durationSeconds,
          })
          .eq('id', currentAux.id)

        if (updateError) throw updateError
      }

      // Create new AUX event
      const now = new Date().toISOString()
      const { data: newEvent, error: createError } = await supabase
        .from('actual_aux_events')
        .insert([
          {
            agent_id: user.id,
            aux_id: auxId,
            actual_start: now,
            source: 'agent',
            session_id: loginSession.id,
          },
        ])
        .select()
        .single()

      if (createError) throw createError

      setCurrentAux(newEvent)
      const auxInfo = auxMaster.find((a) => a.id === auxId)
      setCurrentAuxMaster(auxInfo || null)

      // Update heartbeat
      await supabase.from('login_sessions').update({ last_seen: now }).eq('id', loginSession.id)
    } catch (error: any) {
      toast.error(error.message || 'Failed to change AUX')
      throw error
    } finally {
      setIsChangingAux(false)
    }
  }

  const handleLogout = async () => {
    if (!loginSession?.id) {
      await logout()
      navigate('/login')
      return
    }

    try {
      const now = new Date().toISOString()

      // Close current AUX if active
      if (currentAux?.id && !currentAux.actual_end) {
        const durationSeconds = Math.floor(
          (new Date(now).getTime() - new Date(currentAux.actual_start).getTime()) / 1000
        )

        await supabase.from('actual_aux_events').update({ actual_end: now, duration_seconds: durationSeconds }).eq('id', currentAux.id)
      }

      // Close login session
      await supabase
        .from('login_sessions')
        .update({
          logout_time: now,
          status: 'logged_out',
        })
        .eq('id', loginSession.id)

      await logout()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (error: any) {
      toast.error('Logout failed')
      console.error(error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name}!
          </h1>
          <p className="text-gray-600">
            {formatDisplayDate(currentDate)} • {formatDisplayTime(currentDate)}
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Current Status and Timer */}
          <div className="lg:col-span-1">
            {currentAux && currentAuxMaster ? (
              <LiveTimer
                startTime={new Date(currentAux.actual_start)}
                auxName={currentAuxMaster.name}
                auxColor={currentAuxMaster.color}
              />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <p className="text-gray-500">No active AUX</p>
              </div>
            )}
          </div>

          {/* Schedule Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Shift</h3>
              {schedule ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Shift Time</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {schedule.shift_start} - {schedule.shift_end}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDurationMinutes(calculateDuration(schedule.shift_start, schedule.shift_end))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="text-lg font-semibold text-green-600">
                      {schedule.locked ? '🔒 Locked' : schedule.published ? '✓ Published' : '✎ Draft'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No schedule for today</p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Login Info</h3>
              {loginSession ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600">Login Time</p>
                    <p className="font-semibold text-gray-900">{formatDisplayTime(new Date(loginSession.login_time))}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className="font-semibold text-green-600">● Online</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center">No active session</p>
              )}
            </div>
          </div>
        </div>

        {/* AUX Selector */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Change AUX Status</h2>
          <AuxSelector
            agentId={user?.id || ''}
            currentAuxId={currentAux?.aux_id || null}
            onAuxChange={handleAuxChange}
            isLoading={isChangingAux}
          />
        </div>

        {/* Daily Summary */}
        <DailyAuxSummary agentId={user?.id || ''} scheduleDate={currentDate.toISOString().split('T')[0]} />

        {/* Logout Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </main>
    </div>
  )
}

export default AgentPortal
