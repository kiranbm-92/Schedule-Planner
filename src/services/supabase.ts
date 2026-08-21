import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or anonymous key. Check .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Auth Service
export const authService = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  async logout() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser()
    return { data, error }
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    return { data, error }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },
}

// Profile Service
export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
    return { data, error }
  },
}

// Schedule Service
export const scheduleService = {
  async getSchedules(date: string, agentId?: string) {
    let query = supabase
      .from('schedules')
      .select('*')
      .eq('schedule_date', date)

    if (agentId) {
      query = query.eq('agent_id', agentId)
    }

    const { data, error } = await query
    return { data, error }
  },

  async createSchedule(schedule: any) {
    const { data, error } = await supabase
      .from('schedules')
      .insert([schedule])
      .select()
    return { data, error }
  },

  async updateSchedule(id: string, updates: any) {
    const { data, error } = await supabase
      .from('schedules')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  async deleteSchedule(id: string) {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id)
    return { error }
  },
}

// AUX Master Service
export const auxMasterService = {
  async getAuxCodes() {
    const { data, error } = await supabase
      .from('aux_master')
      .select('*')
      .eq('active', true)
      .order('code')
    return { data, error }
  },

  async createAuxCode(aux: any) {
    const { data, error } = await supabase
      .from('aux_master')
      .insert([aux])
      .select()
    return { data, error }
  },

  async updateAuxCode(id: string, updates: any) {
    const { data, error } = await supabase
      .from('aux_master')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },
}

// Actual AUX Events Service
export const actualAuxService = {
  async createEvent(event: any) {
    const { data, error } = await supabase
      .from('actual_aux_events')
      .insert([event])
      .select()
    return { data, error }
  },

  async updateEvent(id: string, updates: any) {
    const { data, error } = await supabase
      .from('actual_aux_events')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  async getAgentEvents(agentId: string, date: string) {
    const { data, error } = await supabase
      .from('actual_aux_events')
      .select('*')
      .eq('agent_id', agentId)
      .gte('actual_start', `${date}T00:00:00`)
      .lt('actual_start', `${date}T23:59:59`)
      .order('actual_start')
    return { data, error }
  },
}

// Login Session Service
export const loginSessionService = {
  async createSession(session: any) {
    const { data, error } = await supabase
      .from('login_sessions')
      .insert([session])
      .select()
    return { data, error }
  },

  async updateSession(id: string, updates: any) {
    const { data, error } = await supabase
      .from('login_sessions')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  async getActiveSession(agentId: string) {
    const { data, error } = await supabase
      .from('login_sessions')
      .select('*')
      .eq('agent_id', agentId)
      .eq('status', 'active')
      .order('login_time', { ascending: false })
      .limit(1)
      .single()
    return { data, error }
  },
}

// Audit Log Service
export const auditLogService = {
  async createLog(log: any) {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([log])
      .select()
    return { data, error }
  },

  async getLogs(filter?: any) {
    let query = supabase.from('audit_logs').select('*')

    if (filter?.userId) {
      query = query.eq('user_id', filter.userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    return { data, error }
  },
}
