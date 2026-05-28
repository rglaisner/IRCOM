"use client";

import { useState } from "react";
import { getInteractionCount } from "@/lib/teacher/progress";
import type {
  StudentProgress,
  SupportedLanguage,
  TeacherMode,
  TeacherRequestMessage,
  TeacherResponseOutput,
} from "@/lib/teacher/types";

interface ModeInteractionProps {
  mode: TeacherMode;
  language: SupportedLanguage;
  progress: StudentProgress;
  title: string;
  description: string;
  placeholder: string;
  registerInteraction: (mode: TeacherMode) => void;
  getHistory: (mode: TeacherMode) => TeacherRequestMessage[];
  appendHistory: (
    mode: TeacherMode,
    studentInput: string,
    teacherResponse: TeacherResponseOutput,
  ) => void;
}

export function ModeInteraction(props: Readonly<ModeInteractionProps>) {
  const [studentInput, setStudentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [teacherResponse, setTeacherResponse] = useState<TeacherResponseOutput | null>(null);
  const completedCount = getInteractionCount(props.progress, props.mode);

  const targetLabel =
    props.language === "fr"
      ? "Objectif MVP: 2 interactions minimum"
      : "MVP target: minimum 2 interactions";

  const submitPrompt = async () => {
    if (studentInput.trim().length === 0 || isLoading) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: props.mode,
          language: props.language,
          studentInput: studentInput.trim(),
          interactionNumber: completedCount + 1,
          history: props.getHistory(props.mode),
        }),
      });

      const payload = (await response.json()) as {
        data?: TeacherResponseOutput;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Request failed.");
      }

      setTeacherResponse(payload.data);
      props.registerInteraction(props.mode);
      props.appendHistory(props.mode, studentInput.trim(), payload.data);
      setStudentInput("");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Unexpected error.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-zinc-900">
      <header className="mb-4 space-y-1">
        <h2 className="text-xl font-semibold">{props.title}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{props.description}</p>
        <p className="text-sm">
          <span className="font-medium">{targetLabel}</span> - {completedCount}/2
        </p>
      </header>

      <div className="space-y-3">
        <textarea
          className="min-h-36 w-full rounded-md border border-black/20 bg-transparent p-3 text-sm"
          value={studentInput}
          onChange={(event) => setStudentInput(event.target.value)}
          placeholder={props.placeholder}
          data-testid={`${props.mode}-input`}
        />

        <button
          type="button"
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
          onClick={submitPrompt}
          disabled={isLoading || studentInput.trim().length === 0}
          data-testid={`${props.mode}-submit`}
        >
          {isLoading
            ? props.language === "fr"
              ? "Analyse en cours..."
              : "Analyzing..."
            : props.language === "fr"
              ? "Envoyer"
              : "Submit"}
        </button>
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-md bg-red-100 p-3 text-sm text-red-800" data-testid="error-message">
          {errorMessage}
        </p>
      ) : null}

      {teacherResponse ? (
        <article
          className="mt-4 space-y-3 rounded-md border border-black/10 bg-black/5 p-4 dark:border-white/15 dark:bg-white/10"
          data-testid={`${props.mode}-response`}
        >
          <h3 className="font-semibold">{teacherResponse.title}</h3>
          <p className="text-sm">{teacherResponse.feedback}</p>
          <p className="text-sm">
            <span className="font-medium">
              {props.language === "fr" ? "Prochaine etape: " : "Next step: "}
            </span>
            {teacherResponse.nextStep}
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {teacherResponse.critiqueChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  );
}
