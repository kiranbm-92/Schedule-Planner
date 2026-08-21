-- Phase 3: Supabase Database Schema & SQL Migrations
-- Run these migrations in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== AGENCIES TABLE =====
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== UNITS TABLE =====
CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== QUEUES TABLE =====
CREATE TABLE IF NOT EXISTS public.queues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== TEAMS TABLE =====
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  tl_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== USERS/PROFILES TABLE =====
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'wfm', 'tl', 'agent')),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  queue_id UUID REFERENCES public.queues(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  tl_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP ON DELETE CASCADE
);

-- ===== AUX MASTER TABLE =====
CREATE TABLE IF NOT EXISTS public.aux_master (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(10) NOT NULL,
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  default_duration_minutes INTEGER DEFAULT 15,
  agent_selectable BOOLEAN DEFAULT true,
  wfm_selectable BOOLEAN DEFAULT true,
  counts_as_available BOOLEAN DEFAULT false,
  counts_as_productive BOOLEAN DEFAULT true,
  counts_as_non_productive BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== SCHEDULES TABLE =====
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_date DATE NOT NULL,
  agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'locked')),
  published BOOLEAN DEFAULT false,
  locked BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(schedule_date, agent_id)
);

-- ===== SCHEDULE ACTIVITIES TABLE =====
CREATE TABLE IF NOT EXISTS public.schedule_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  aux_id UUID NOT NULL REFERENCES public.aux_master(id) ON DELETE RESTRICT,
  planned_start TIME NOT NULL,
  planned_end TIME NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== ACTUAL AUX EVENTS TABLE =====
CREATE TABLE IF NOT EXISTS public.actual_aux_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  aux_id UUID NOT NULL REFERENCES public.aux_master(id) ON DELETE RESTRICT,
  schedule_activity_id UUID REFERENCES public.schedule_activities(id) ON DELETE SET NULL,
  actual_start TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_end TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  source VARCHAR(20) NOT NULL DEFAULT 'agent' CHECK (source IN ('agent', 'wfm', 'system')),
  session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== LOGIN SESSIONS TABLE =====
CREATE TABLE IF NOT EXISTS public.login_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  login_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  logout_time TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'logged_out')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== AUDIT LOGS TABLE =====
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== INDEXES =====
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_active ON public.users(active);
CREATE INDEX idx_users_agency ON public.users(agency_id);
CREATE INDEX idx_schedules_date ON public.schedules(schedule_date);
CREATE INDEX idx_schedules_agent ON public.schedules(agent_id);
CREATE INDEX idx_schedules_status ON public.schedules(status);
CREATE INDEX idx_schedule_activities_schedule ON public.schedule_activities(schedule_id);
CREATE INDEX idx_schedule_activities_agent ON public.schedule_activities(agent_id);
CREATE INDEX idx_actual_aux_agent ON public.actual_aux_events(agent_id);
CREATE INDEX idx_actual_aux_start ON public.actual_aux_events(actual_start);
CREATE INDEX idx_login_sessions_agent ON public.login_sessions(agent_id);
CREATE INDEX idx_login_sessions_status ON public.login_sessions(status);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);

-- ===== ROW LEVEL SECURITY POLICIES =====
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actual_aux_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aux_master ENABLE ROW LEVEL SECURITY;

-- Agent can read own profile
CREATE POLICY agent_read_own_profile ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Agent can update own profile (limited fields)
CREATE POLICY agent_update_own_profile ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- WFM/Admin can read all users
CREATE POLICY wfm_read_all_users ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('wfm', 'admin')
    )
  );

-- Admin can manage all users
CREATE POLICY admin_manage_users ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Agent can read own schedule
CREATE POLICY agent_read_own_schedule ON public.schedules
  FOR SELECT USING (auth.uid() = agent_id);

-- WFM/Admin can read/manage all schedules
CREATE POLICY wfm_manage_schedules ON public.schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('wfm', 'admin')
    )
  );

-- Agent can read own actual AUX events
CREATE POLICY agent_read_own_aux_events ON public.actual_aux_events
  FOR SELECT USING (auth.uid() = agent_id);

-- Agent can create own actual AUX events
CREATE POLICY agent_create_own_aux_events ON public.actual_aux_events
  FOR INSERT WITH CHECK (auth.uid() = agent_id);

-- Agent can update own actual AUX events
CREATE POLICY agent_update_own_aux_events ON public.actual_aux_events
  FOR UPDATE USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

-- WFM can read all actual AUX events
CREATE POLICY wfm_read_all_aux_events ON public.actual_aux_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('wfm', 'admin')
    )
  );

-- Agent can read own login sessions
CREATE POLICY agent_read_own_sessions ON public.login_sessions
  FOR SELECT USING (auth.uid() = agent_id);

-- Agent can create/update own login sessions
CREATE POLICY agent_manage_own_sessions ON public.login_sessions
  FOR ALL USING (auth.uid() = agent_id);

-- WFM can read all login sessions
CREATE POLICY wfm_read_all_sessions ON public.login_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('wfm', 'admin')
    )
  );

-- AUX Master readable by all authenticated users
CREATE POLICY read_aux_master ON public.aux_master
  FOR SELECT USING (true);

-- Only Admin/WFM can modify AUX Master
CREATE POLICY manage_aux_master ON public.aux_master
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('wfm', 'admin')
    )
  );

-- Audit logs readable by admin/wfm
CREATE POLICY read_audit_logs ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('wfm', 'admin')
    )
  );

-- ===== FUNCTIONS FOR TRIGGERS =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update triggers for timestamp columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aux_master_updated_at BEFORE UPDATE ON public.aux_master
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_activities_updated_at BEFORE UPDATE ON public.schedule_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_actual_aux_events_updated_at BEFORE UPDATE ON public.actual_aux_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_login_sessions_updated_at BEFORE UPDATE ON public.login_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
