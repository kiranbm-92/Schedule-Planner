// User and Authentication Types
export interface User {
  id: string
  employee_id: string
  name: string
  email: string
  role: 'admin' | 'wfm' | 'tl' | 'agent'
  agency_id: string | null
  unit_id: string | null
  queue_id: string | null
  team_id: string | null
  tl_id: string | null
  active: boolean
  created_at: string
  updated_at: string
}

// Agency, Unit, Queue, Team Types
export interface Agency {
  id: string
  name: string
  active: boolean
  created_at: string
}

export interface Unit {
  id: string
  name: string
  active: boolean
  created_at: string
}

export interface Queue {
  id: string
  name: string
  active: boolean
  created_at: string
}

export interface Team {
  id: string
  name: string
  tl_id: string | null
  active: boolean
  created_at: string
}

// AUX Master Types
export interface AuxMaster {
  id: string
  code: string
  name: string
  short_name: string
  description: string
  color: string
  default_duration_minutes: number
  agent_selectable: boolean
  wfm_selectable: boolean
  active: boolean
  created_at: string
  updated_at: string
}

// Schedule Types
export interface Schedule {
  id: string
  schedule_date: string
  agent_id: string
  shift_start: string
  shift_end: string
  status: 'draft' | 'published' | 'locked'
  published: boolean
  locked: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface ScheduleActivity {
  id: string
  schedule_id: string
  agent_id: string
  aux_id: string
  planned_start: string
  planned_end: string
  created_by: string
  created_at: string
  updated_at: string
}

// Actual AUX Event Types
export interface ActualAuxEvent {
  id: string
  agent_id: string
  aux_id: string
  schedule_activity_id: string | null
  actual_start: string
  actual_end: string | null
  duration_seconds: number | null
  source: 'agent' | 'wfm' | 'system'
  session_id: string
  created_at: string
  updated_at: string
}

// Login Session Types
export interface LoginSession {
  id: string
  agent_id: string
  login_time: string
  logout_time: string | null
  last_seen: string
  status: 'active' | 'inactive' | 'logged_out'
  created_at: string
  updated_at: string
}

// Audit Log Types
export interface AuditLog {
  id: string
  user_id: string
  action: string
  entity: string
  entity_id: string
  old_value: Record<string, any> | null
  new_value: Record<string, any> | null
  created_at: string
}

// UI/Display Types
export interface TimeSlot {
  hour: number
  minute: number
  label: string
}

export interface ScheduleRow {
  agent: User
  schedule: Schedule | null
  activities: ScheduleActivity[]
}

export interface DashboardKPI {
  label: string
  value: number
  change?: number
  unit?: string
}
