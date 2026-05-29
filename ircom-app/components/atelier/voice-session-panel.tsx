"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { HandRaisedIcon, PauseIcon, PlayIcon } from "@/components/ui/icons";
import { TranscriptPanel } from "@/components/atelier/transcript-panel";
import { t } from "@/lib/copy/ui-messages";
import { useSpeechRecognition } from "@/lib/atelier/speech";
import type { useVoiceBriefing } from "@/lib/hooks/use-voice-briefing";
import type { AtelierScenario } from "@/lib/teacher/curriculum-types";
import type { SprintScenario } from "@/lib/teacher/curriculum-types";
import type { SupportedLanguage, TeacherRequestMessage } from "@/lib/teacher/types";

type SessionScenario = AtelierScenario | SprintScenario;
type VoiceBriefing = ReturnType<typeof useVoiceBriefing>;

interface VoiceSessionPanelProps {
  language: SupportedLanguage;
  scenario: SessionScenario;
  chatHistory: TeacherRequestMessage[];
  onChatReply: (question: string, answer: string) => void;
  briefing: VoiceBriefing;
}

export function VoiceSessionPanel({
  language,
  scenario,
  onChatReply,
  briefing,
}: Readonly<VoiceSessionPanelProps>) {
  const {
    orchestrator,
    sessionState,
    transcript,
    errorMessage,
    isNarrating,
    isChatLoading,
    isLiveActive,
    isTextFallback,
    startBriefing,
    pauseBriefing,
    resumeBriefing,
    raiseHand,
    doneSpeaking,
    askQuestion,
  } = briefing;

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "student" | "teacher"; content: string }>>([]);
  const [chatError, setChatError] = useState<string | null>(null);

  const appendChatExchange = useCallback((question: string, answer: string) => {
    setChatMessages((prev) => [
      ...prev,
      { role: "student", content: question },
      { role: "teacher", content: answer },
    ]);
    onChatReply(question, answer);
  }, [onChatReply]);

  const handleVoiceQuestion = useCallback(
    async (spoken: string) => {
      if (spoken.trim().length === 0) {
        return;
      }
      setChatError(null);
      const result = await askQuestion(spoken);
      if (result.answer) {
        appendChatExchange(spoken, result.answer);
      } else if (result.error) {
        setChatError(result.error);
      }
    },
    [appendChatExchange, askQuestion],
  );

  const { isListening, start: startListening, stop: stopListening, isSupported: sttSupported } =
    useSpeechRecognition(language, handleVoiceQuestion);

  const submitChat = async () => {
    const question = chatInput.trim();
    if (question.length === 0) {
      return;
    }
    setChatInput("");
    setChatError(null);
    setChatOpen(true);
    const result = await askQuestion(question);
    if (result.answer) {
      appendChatExchange(question, result.answer);
    } else if (result.error) {
      setChatError(result.error);
    }
  };

  const handleRaiseHand = async () => {
    if (isLiveActive) {
      await raiseHand();
      return;
    }
    setChatOpen(true);
    if (sttSupported) {
      startListening();
    }
  };

  useEffect(() => {
    setChatMessages([]);
    setChatOpen(false);
    setChatError(null);
    stopListening();
  }, [scenario.id, stopListening]);

  const isPaused = sessionState === "paused";
  const isHandRaised = sessionState === "handRaised";
  const canPause =
    isLiveActive &&
    (sessionState === "narrating" || sessionState === "handRaised");
  const canResume = isPaused;

  return (
    <div className="space-y-4" data-testid="voice-session-panel">
      <TranscriptPanel language={language} transcript={transcript} isStreaming={isNarrating} />

      {isTextFallback && transcript.trim().length > 0 ? (
        <p
          className="rounded-[var(--ircom-radius-md)] border border-[var(--ircom-border)] bg-[var(--ircom-panel-subtle)] p-3 text-sm text-[var(--ircom-text-heading)]"
          data-testid="voice-fallback-notice"
        >
          {t(language, "voiceFallbackNotice")}
        </p>
      ) : null}

      {orchestrator.isCheckpointActive ? (
        <p
          className="rounded-[var(--ircom-radius-md)] border border-[var(--ircom-blue)] bg-[#3b74f711] p-3 text-sm text-[var(--ircom-text-heading)]"
          data-testid="checkpoint-waiting-banner"
        >
          {language === "fr"
            ? "Le formateur attend votre réponse pour continuer."
            : "Your facilitator is waiting for your answer to continue."}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => void startBriefing()}
          disabled={isNarrating || sessionState === "connecting"}
          data-testid="narration-start"
        >
          {t(language, "startNarration")}
        </Button>
        <Button
          variant="secondary"
          onClick={isPaused ? resumeBriefing : pauseBriefing}
          disabled={!canPause && !canResume}
          data-testid="narration-pause-resume"
        >
          {isPaused ? (
            <>
              <PlayIcon className="mr-1.5 h-4 w-4" />
              {t(language, "resumeNarration")}
            </>
          ) : (
            <>
              <PauseIcon className="mr-1.5 h-4 w-4" />
              {t(language, "pauseNarration")}
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          onClick={() => void handleRaiseHand()}
          data-testid="raise-hand"
          aria-label={t(language, "raiseHand")}
          title={t(language, "raiseHand")}
          className="!px-3"
        >
          <HandRaisedIcon className="h-5 w-5" />
          {isListening ? (
            <span className="sr-only" aria-live="polite">
              {language === "fr" ? "Écoute en cours" : "Listening"}
            </span>
          ) : null}
        </Button>
        {isHandRaised ? (
          <Button variant="secondary" onClick={doneSpeaking} data-testid="done-speaking">
            {t(language, "doneSpeaking")}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={() => setChatOpen((open) => !open)} data-testid="toggle-chat">
          {t(language, "openChat")}
        </Button>
      </div>

      {chatOpen ? (
        <div className="space-y-3 rounded-[var(--ircom-radius-md)] border border-[var(--ircom-border)] p-4" data-testid="atelier-chat-panel">
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {chatMessages.map((message, index) => (
              <p
                key={`${message.role}-${index}`}
                className={`text-sm ${message.role === "student" ? "ircom-secondary" : "ircom-body"}`}
              >
                <span className="font-medium">
                  {message.role === "student"
                    ? language === "fr"
                      ? "Vous : "
                      : "You: "
                    : language === "fr"
                      ? "Coach : "
                      : "Coach: "}
                </span>
                {message.content}
              </p>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void submitChat();
                }
              }}
              className="ircom-input min-h-[var(--ircom-touch-min)] flex-1 rounded-[var(--ircom-radius-md)] px-3 text-sm"
              placeholder={language === "fr" ? "Votre question…" : "Your question…"}
              data-testid="atelier-chat-input"
            />
            <Button onClick={() => void submitChat()} disabled={isChatLoading} data-testid="atelier-chat-send">
              {isChatLoading
                ? language === "fr"
                  ? "Envoi…"
                  : "Sending…"
                : language === "fr"
                  ? "Envoyer"
                  : "Send"}
            </Button>
          </div>
          {chatError ? (
            <p className="text-sm text-[var(--ircom-red)]" data-testid="chat-error-message">
              {chatError}
            </p>
          ) : null}
          {!sttSupported ? (
            <p className="ircom-secondary text-xs">
              {language === "fr"
                ? "Micro non disponible sur ce navigateur — utilisez le champ texte."
                : "Microphone unavailable in this browser — use the text field."}
            </p>
          ) : null}
        </div>
      ) : null}

      {errorMessage ? (
        <p className="rounded-[var(--ircom-radius-md)] bg-[#f0587222] p-3 text-sm text-[var(--ircom-red)]" data-testid="voice-error-message">
          {errorMessage}
        </p>
      ) : null}

      {isPaused ? (
        <p className="ircom-secondary text-xs" data-testid="session-paused-hint">
          {language === "fr"
            ? "Briefing en pause — reprenez l'écoute quand vous êtes prêt."
            : "Briefing paused — resume when you are ready."}
        </p>
      ) : null}
    </div>
  );
}
