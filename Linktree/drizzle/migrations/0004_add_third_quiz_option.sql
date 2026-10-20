-- Third quiz option ("Both are AI generated") + editable wrong-answer message.
ALTER TABLE public.quiz ADD COLUMN option_c text NOT NULL DEFAULT '';
ALTER TABLE public.quiz ADD COLUMN wrong_message text NOT NULL DEFAULT 'Pink one only :)';

-- Allow the new option to be voted for and to be the configured answer.
ALTER TABLE public.quiz_answer DROP CONSTRAINT quiz_answer_correct_option_check;
ALTER TABLE public.quiz_answer ADD CONSTRAINT quiz_answer_correct_option_check CHECK (correct_option IN ('a','b','c'));
ALTER TABLE public.quiz_votes DROP CONSTRAINT quiz_votes_choice_check;
ALTER TABLE public.quiz_votes ADD CONSTRAINT quiz_votes_choice_check CHECK (choice IN ('a','b','c'));

-- Reveal now reports vote totals for all three options.
DROP FUNCTION public.quiz_public_reveal();
CREATE FUNCTION public.quiz_public_reveal()
 RETURNS TABLE(correct_option text, votes_a integer, votes_b integer, votes_c integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT a.correct_option,
    (SELECT count(*)::int FROM public.quiz_votes WHERE choice = 'a'),
    (SELECT count(*)::int FROM public.quiz_votes WHERE choice = 'b'),
    (SELECT count(*)::int FROM public.quiz_votes WHERE choice = 'c')
  FROM public.quiz q CROSS JOIN public.quiz_answer a
  WHERE q.id = 1 AND a.id = 1 AND q.reveal_answer AND a.correct_option IS NOT NULL
$function$;
GRANT EXECUTE ON FUNCTION public.quiz_public_reveal() TO public, anon, authenticated, service_role;