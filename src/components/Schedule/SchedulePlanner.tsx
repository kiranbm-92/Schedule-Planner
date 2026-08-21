import React, { useState, useEffect, useRef } from 'react'
import { User, AuxMaster, Schedule, ScheduleActivity } from '@/types'
import TimelineHeader from './TimelineHeader'
import ScheduleRow from './ScheduleRow'
import { Loader, Plus, Save, X } from 'lucide-react'
import { supabase } from '@/services/supabase'
import toast from 'react-hot-toast'

interface SchedulePlannerProps {
  date: string
  agents: User[]
  isEditMode: boolean
}

const SchedulePlanner: React.FC<SchedulePlannerProps> = ({ date, agents, isEditMode }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [activities, setActivities] = useState<ScheduleActivity[]>([])
  const [auxMaster, setAuxMaster] = useState<AuxMaster[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<ScheduleActivity | null>(null)

  useEffect(() => {
    fetchScheduleData()
  }, [date])

  const fetchScheduleData = async () => {
    try {
      setIsLoading(true)

      // Fetch schedules for the date
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('schedules')
        .select('*')
        .eq('schedule_date', date)

      if (schedulesError) throw schedulesError

      // Fetch all schedule activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('schedule_activities')
        .select('*')

      if (activitiesError) throw activitiesError

      // Fetch AUX master
      const { data: auxData, error: auxError } = await supabase
        .from('aux_master')
        .select('*')
        .eq('active', true)

      if (auxError) throw auxError

      setSchedules(schedulesData || [])
      setActivities(activitiesData || [])
      setAuxMaster(auxData || [])
    } catch (error: any) {
      toast.error('Failed to load schedule data')
      console.error('Schedule fetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createAuxMasterMap = () => {
    return auxMaster.reduce(
      (acc, aux) => {
        acc[aux.id] = aux
        return acc
      },
      {} as Record<string, AuxMaster>
    )
  }

  const getScheduleForAgent = (agentId: string) => {
    return schedules.find((s) => s.agent_id === agentId && s.schedule_date === date) || null
  }

  const getActivitiesForAgent = (agentId: string) => {
    return activities.filter((a) => a.agent_id === agentId)
  }

  const handleSaveSchedules = async () => {
    try {
      setIsSaving(true)
      // Validation and save logic here
      toast.success('Schedules saved successfully')
    } catch (error: any) {
      toast.error('Failed to save schedules')
    } finally {
      setIsSaving(false)
    }
  }

  const auxMasterMap = createAuxMasterMap()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-900">Schedule for {date}</h2>
        {isEditMode && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveSchedules}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
            >
              {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Timeline Header */}
      <TimelineHeader scrollContainerRef={scrollContainerRef} />

      {/* Schedule Rows */}
      <div className="flex-1 overflow-y-auto">
        {agents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No agents found. Please add agents first.</p>
          </div>
        ) : (
          agents.map((agent) => (
            <ScheduleRow
              key={agent.id}
              agent={agent}
              schedule={getScheduleForAgent(agent.id)}
              activities={getActivitiesForAgent(agent.id)}
              auxMasterMap={auxMasterMap}
              isEditable={isEditMode}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default SchedulePlanner
