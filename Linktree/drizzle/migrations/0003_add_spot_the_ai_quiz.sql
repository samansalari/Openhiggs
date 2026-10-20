CREATE TABLE public.quiz (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_enabled boolean NOT NULL DEFAULT true,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  video_url text,
  poster_url text,
  question text NOT NULL DEFAULT '',
  option_a text NOT NULL DEFAULT 'Option A',
  option_b text NOT NULL DEFAULT 'Option B',
  reveal_answer boolean NOT NULL DEFAULT false,
  round integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quiz TO anon, authenticated;
GRANT UPDATE ON public.quiz TO authenticated;
GRANT ALL ON public.quiz TO service_role;
ALTER TABLE public.quiz ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read quiz" ON public.quiz FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update quiz" ON public.quiz FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.quiz_answer (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  correct_option text CHECK (correct_option IN ('a','b'))
);
GRANT SELECT, UPDATE ON public.quiz_answer TO authenticated;
GRANT ALL ON public.quiz_answer TO service_role;
ALTER TABLE public.quiz_answer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read answer" ON public.quiz_answer FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update answer" ON public.quiz_answer FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.quiz_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  choice text NOT NULL CHECK (choice IN ('a','b')),
  voter_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.quiz_votes TO authenticated;
GRANT ALL ON public.quiz_votes TO service_role;
ALTER TABLE public.quiz_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read votes" ON public.quiz_votes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete votes" ON public.quiz_votes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Answer and totals become public only once the owner reveals them.
CREATE OR REPLACE FUNCTION public.quiz_public_reveal()
RETURNS TABLE (correct_option text, votes_a integer, votes_b integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.correct_option,
    (SELECT count(*)::int FROM public.quiz_votes WHERE choice = 'a'),
    (SELECT count(*)::int FROM public.quiz_votes WHERE choice = 'b')
  FROM public.quiz q CROSS JOIN public.quiz_answer a
  WHERE q.id = 1 AND a.id = 1 AND q.reveal_answer AND a.correct_option IS NOT NULL
$$;
GRANT EXECUTE ON FUNCTION public.quiz_public_reveal() TO anon, authenticated;

INSERT INTO public.quiz (id, title, subtitle, video_url, poster_url, question, option_a, option_b)
VALUES (1, 'Can You Spot the AI?',
  'Watch the video. Which character is AI-generated, and which one is real?',
  '/__l5e/assets-v1/247e6c4f-2b18-4712-b771-d4d634b6aad0/posting.mp4',
  '/__l5e/assets-v1/23d95d01-da69-41fe-9029-d99372301a54/posting-poster.jpg',
  'Which character is AI-generated?',
  'The one in the red dress', 'The one in the pink top');
INSERT INTO public.quiz_answer (id, correct_option) VALUES (1, NULL);