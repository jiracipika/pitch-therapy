-- ============================================================
-- Pitch Therapy — Sample Seed Data for Development
-- ============================================================

-- Insert a dev user (simulate a Clerk user)
insert into public.users (id, email, display_name, vocal_range_low, vocal_range_high)
values (
  'a0000000-0000-0000-0000-000000000001',
  'dev@pitchtherapy.app',
  'Dev User',
  130.81,  -- C3
  523.25   -- C5
) on conflict (id) do nothing;

-- Insert a second user for leaderboard testing
insert into public.users (id, email, display_name)
values (
  'b0000000-0000-0000-0000-000000000002',
  'friend@example.com',
  'Friendo'
) on conflict (id) do nothing;

-- Initialize streaks
insert into public.streaks (user_id, current_streak, longest_streak, last_play_date)
values
  ('a0000000-0000-0000-0000-000000000001', 3, 7, current_date),
  ('b0000000-0000-0000-0000-000000000002', 1, 5, current_date)
on conflict (user_id) do nothing;

-- A completed note_id session
insert into public.sessions (id, user_id, mode, difficulty, score, max_possible_score, rounds_completed, total_rounds, accuracy_pct, duration_seconds)
values (
  'c1000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'note_id',
  'beginner',
  8, 10, 10, 10, 80.00, 120
);

-- Rounds for the above session
insert into public.rounds (session_id, round_number, target_note, user_answer, is_correct, cents_off, response_time_ms, points_earned) values
  ('c1000000-0000-0000-0000-000000000001', 1, 'C4', 'C4', true, 0, 1200, 1),
  ('c1000000-0000-0000-0000-000000000001', 2, 'D4', 'D4', true, 5, 900, 1),
  ('c1000000-0000-0000-0000-000000000001', 3, 'E4', 'F4', false, 200, 3000, 0),
  ('c1000000-0000-0000-0000-000000000001', 4, 'F4', 'F4', true, 0, 1100, 1),
  ('c1000000-0000-0000-0000-000000000001', 5, 'G4', 'G4', true, 10, 1500, 1),
  ('c1000000-0000-0000-0000-000000000001', 6, 'A4', 'A4', true, 0, 800, 1),
  ('c1000000-0000-0000-0000-000000000001', 7, 'B4', 'Bb4', false, 100, 2500, 0),
  ('c1000000-0000-0000-0000-000000000001', 8, 'C5', 'C5', true, 0, 1000, 1),
  ('c1000000-0000-0000-0000-000000000001', 9, 'D5', 'D5', true, 15, 1300, 1),
  ('c1000000-0000-0000-0000-000000000001', 10, 'E5', 'E5', true, 0, 1100, 1);

-- A frequency_guess session (in progress)
insert into public.sessions (id, user_id, mode, difficulty, score, max_possible_score, rounds_completed, total_rounds, accuracy_pct, duration_seconds)
values (
  'c1000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'frequency_guess',
  'intermediate',
  5, 10, 7, 10, 71.43, 85
);

-- Leaderboard entries
insert into public.leaderboard (user_id, date, mode, guesses_used, total_error, solve_time_seconds, is_completed) values
  ('a0000000-0000-0000-0000-000000000001', current_date, 'note_wordle', 3, null, 45, true),
  ('a0000000-0000-0000-0000-000000000001', current_date, 'frequency_wordle', 5, 2.3400, 120, true),
  ('b0000000-0000-0000-0000-000000000002', current_date, 'note_wordle', 4, null, 62, true),
  ('b0000000-0000-0000-0000-000000000002', current_date, 'frequency_wordle', 6, 3.8100, 180, true),
  ('a0000000-0000-0000-0000-000000000001', current_date - 1, 'note_wordle', 2, null, 30, true),
  ('a0000000-0000-0000-0000-000000000001', current_date - 2, 'note_wordle', 4, null, 55, true);

-- Seed daily challenges
select public.seed_daily_challenges();
