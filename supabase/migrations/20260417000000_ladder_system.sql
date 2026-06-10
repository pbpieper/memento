-- Ladder System Tables and Indexes

-- Ladder Progress: tracks per-user progress through the 10-level ladder per skit
CREATE TABLE IF NOT EXISTS public.ladder_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skit_id TEXT NOT NULL,
  current_level INTEGER NOT NULL DEFAULT 1,
  unlocked_levels INTEGER[] NOT NULL DEFAULT '{1}',
  completed_levels INTEGER[] NOT NULL DEFAULT '{}',
  level_scores JSONB NOT NULL DEFAULT '{}',
  tasks_completed JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, skit_id)
);

-- Challenge Attempts: audit trail of every challenge attempt for history and analytics
CREATE TABLE IF NOT EXISTS public.challenge_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skit_id TEXT NOT NULL,
  level_id INTEGER NOT NULL,
  challenge_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ladder_progress_user_skit
  ON public.ladder_progress(user_id, skit_id);

CREATE INDEX IF NOT EXISTS idx_challenge_attempts_user_skit
  ON public.challenge_attempts(user_id, skit_id);

CREATE INDEX IF NOT EXISTS idx_challenge_attempts_attempted_at
  ON public.challenge_attempts(attempted_at DESC);

-- RLS: enable row-level security
ALTER TABLE public.ladder_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_attempts ENABLE ROW LEVEL SECURITY;

-- Policies: users manage only their own data
-- (CREATE POLICY has no IF NOT EXISTS in Postgres; drop-then-create for idempotency)
DROP POLICY IF EXISTS "Users manage own ladder progress" ON public.ladder_progress;
CREATE POLICY "Users manage own ladder progress"
  ON public.ladder_progress FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own challenge attempts" ON public.challenge_attempts;
CREATE POLICY "Users manage own challenge attempts"
  ON public.challenge_attempts FOR ALL
  USING (auth.uid() = user_id);

-- Trigger: auto-update ladder_progress.updated_at on writes
CREATE OR REPLACE TRIGGER set_ladder_progress_updated_at
  BEFORE UPDATE ON public.ladder_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
