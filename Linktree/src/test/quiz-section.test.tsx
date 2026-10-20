import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QuizSection } from "@/components/QuizSection";
import type { PublicQuiz } from "@/lib/page-types";

const baseQuiz: PublicQuiz = {
  id: 1,
  is_enabled: true,
  option_a: "The one in the red dress",
  option_b: "The one in the pink top",
  option_c: "Both are AI generated",
  wrong_message: "Pink one only :)",
  poster_url: null,
  question: "Which character is AI-generated?",
  reveal_answer: false,
  round: 1,
  subtitle: "Watch the video.",
  title: "Can You Spot the AI?",
  updated_at: "2026-01-01T00:00:00Z",
  video_url: null,
  reveal: null,
};

const wrongButton = () => screen.getByRole("button", { name: /red dress/i });
const rightButton = () => screen.getByRole("button", { name: /pink top/i });

beforeEach(() => {
  localStorage.clear();
});

describe("QuizSection tap feedback", () => {
  it("tapping the wrong character shows a wrong alert and shakes the card", async () => {
    const onVote = vi.fn().mockResolvedValue({ ok: true, correct: false });
    const { container } = render(<QuizSection quiz={baseQuiz} onVote={onVote} />);

    fireEvent.click(wrongButton());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Pink one only :)");
    await waitFor(() => expect(container.querySelector("section")?.className).toContain("animate-shake"));
  });

  it("tapping the correct character shows the congratulations message", async () => {
    const onVote = vi.fn().mockResolvedValue({ ok: true, correct: true });
    render(<QuizSection quiz={baseQuiz} onVote={onVote} />);

    fireEvent.click(rightButton());

    expect(await screen.findByText(/Correct — you spotted the AI/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("tapping both characters still counts as wrong — no congratulations", async () => {
    const onVote = vi.fn().mockResolvedValue({ ok: true, correct: false });
    render(<QuizSection quiz={baseQuiz} onVote={onVote} />);

    fireEvent.click(wrongButton());
    await screen.findByRole("alert");
    fireEvent.click(rightButton());
    await screen.findByText("The one in the pink top");

    expect(screen.queryByText(/Correct — you spotted the AI/i)).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Pink one only :)");
    expect(onVote).toHaveBeenCalledTimes(1); // no second vote recorded
  });

  it("tapping 'Both are AI generated' shows the wrong-answer message and shakes the card", async () => {
    const onVote = vi.fn().mockResolvedValue({ ok: true, correct: false });
    const { container } = render(<QuizSection quiz={baseQuiz} onVote={onVote} />);

    fireEvent.click(screen.getByRole("button", { name: /both are ai generated/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Pink one only :)");
    await waitFor(() => expect(container.querySelector("section")?.className).toContain("animate-shake"));
    expect(screen.queryByText(/Correct — you spotted the AI/i)).not.toBeInTheDocument();
  });
});

describe("QuizSection fresh session per page load", () => {
  it("a reload starts unselected and grades the new pick", async () => {
    const onVote = vi.fn().mockResolvedValueOnce({ ok: true, correct: false }).mockResolvedValueOnce({ ok: true, correct: true });
    const first = render(<QuizSection quiz={baseQuiz} onVote={onVote} />);
    fireEvent.click(wrongButton());
    await screen.findByRole("alert");
    first.unmount();

    render(<QuizSection quiz={baseQuiz} onVote={onVote} />);
    expect(rightButton()).toBeEnabled();
    expect(rightButton()).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(rightButton());
    expect(await screen.findByText(/Correct — you spotted the AI/i)).toBeInTheDocument();
  });
});
