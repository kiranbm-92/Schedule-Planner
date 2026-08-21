-- Phase 3: Seed data for AUX Master and sample agencies/units/queues

-- Insert Agencies
INSERT INTO public.agencies (name, active) VALUES
  ('Radical Minds', true),
  ('CNX', true),
  ('FiveS', true),
  ('RM', true)
ON CONFLICT (name) DO NOTHING;

-- Insert Units
INSERT INTO public.units (name, active) VALUES
  ('Customer Support', true),
  ('Technical Support', true),
  ('Sales Support', true),
  ('Quality Assurance', true)
ON CONFLICT (name) DO NOTHING;

-- Insert Queues
INSERT INTO public.queues (name, active) VALUES
  ('Live Chat', true),
  ('Email', true),
  ('Phone', true),
  ('Social Media', true)
ON CONFLICT (name) DO NOTHING;

-- Insert Default AUX Codes
INSERT INTO public.aux_master 
  (code, name, short_name, description, color, default_duration_minutes, agent_selectable, wfm_selectable, active) 
VALUES
  ('AVAILABLE', 'Available', 'AVL', 'Agent is available', '#10B981', 15, true, true, true),
  ('BREAK', 'Break', 'BRK', 'Agent is on break', '#F59E0B', 15, true, true, true),
  ('LUNCH', 'Lunch', 'LUN', 'Agent is on lunch break', '#8B5CF6', 30, true, true, true),
  ('BIO_BREAK', 'Bio Break', 'BIO', 'Agent is on bio break', '#EC4899', 15, true, true, true),
  ('BREAK_PENDING', 'Break Pending', 'BRP', 'Break is pending', '#6B7280', 15, false, true, true),
  ('TEAM_MEETING', 'Team Meeting', 'TM', 'Team meeting in progress', '#3B82F6', 30, false, true, true),
  ('TL_FEEDBACK', 'TL Feedback', 'TLF', 'Team lead feedback session', '#0EA5E9', 30, false, true, true),
  ('QA_FEEDBACK', 'QA Feedback', 'QAF', 'Quality assurance feedback', '#06B6D4', 30, false, true, true),
  ('NHT_TRAINING', 'NHT Training', 'NHT', 'New Hire Training', '#14B8A6', 60, false, true, true),
  ('PKT_TRAINING', 'PKT Training', 'PKT', 'Product Knowledge Training', '#A78BFA', 60, false, true, true),
  ('TRAINING', 'Training', 'TRN', 'General training', '#7C3AED', 60, false, true, true),
  ('COACHING', 'Coaching', 'COA', 'One-on-one coaching', '#DC2626', 30, false, true, true),
  ('OFFLINE', 'Offline', 'OFF', 'Agent is offline', '#6B7280', 15, false, true, true)
ON CONFLICT (code) DO NOTHING;
