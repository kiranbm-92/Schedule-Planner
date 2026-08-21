import { create } from 'zustand'
import { User, LoginSession, ActualAuxEvent } from '@/types'
import { supabase } from '@/services/supabase'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) throw profileError

        set({ user: profile, isLoading: false })

        // Create login session for agents
        if (profile.role === 'agent') {
          const { data: sessionData, error: sessionError } = await supabase
            .from('login_sessions')
            .insert([
              {
                agent_id: profile.id,
                login_time: new Date().toISOString(),
                status: 'active',
              },
            ])
            .select()
            .single()

          if (sessionError) throw sessionError
        }
      }
    } catch (error: any) {
      set({
        error: error.message || 'Login failed',
        isLoading: false,
      })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      set({ user: null, isLoading: false })
    } catch (error: any) {
      set({
        error: error.message || 'Logout failed',
        isLoading: false,
      })
      throw error
    }
  },

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))

interface AgentPortalState {
  currentAux: ActualAuxEvent | null
  loginSession: LoginSession | null
  dailyAuxSummary: Record<string, { duration: number; instances: number }>
  currentTime: Date
  setCurrentAux: (aux: ActualAuxEvent | null) => void
  setLoginSession: (session: LoginSession | null) => void
  setDailyAuxSummary: (summary: Record<string, any>) => void
  setCurrentTime: (time: Date) => void
}

export const useAgentPortalStore = create<AgentPortalState>((set) => ({
  currentAux: null,
  loginSession: null,
  dailyAuxSummary: {},
  currentTime: new Date(),
  setCurrentAux: (aux) => set({ currentAux: aux }),
  setLoginSession: (session) => set({ loginSession: session }),
  setDailyAuxSummary: (summary) => set({ dailyAuxSummary: summary }),
  setCurrentTime: (time) => set({ currentTime: time }),
}))

interface ScheduleState {
  selectedDate: Date
  selectedAgentId: string | null
  isEditMode: boolean
  selectedAuxId: string | null
  setSelectedDate: (date: Date) => void
  setSelectedAgentId: (id: string | null) => void
  setEditMode: (mode: boolean) => void
  setSelectedAuxId: (id: string | null) => void
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  selectedDate: new Date(),
  selectedAgentId: null,
  isEditMode: false,
  selectedAuxId: null,
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedAgentId: (id) => set({ selectedAgentId: id }),
  setEditMode: (mode) => set({ isEditMode: mode }),
  setSelectedAuxId: (id) => set({ selectedAuxId: id }),
}))
