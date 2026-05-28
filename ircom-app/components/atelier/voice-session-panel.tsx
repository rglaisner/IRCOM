"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TranscriptPanel } from "@/components/atelier/transcript-panel";
import { t } from "@/lib/copy/ui-messages";
import { useAtelierSession } from "@/lib/hooks/use-atelier-session";
import { useSpeechRecognition, useSpeechSynthesis } from "@/lib/atelier/speech";
import type { AtelierScenario } from "@/lib/teacher/curriculum-types";
import type { SprintScenario } from "@/lib/teacher/curriculum-types";
import type { SupportedLanguage, TeacherRequestMessage } from "@/lib/teacher/types";

type SessionScenario = AtelierScenario | SprintScenario;

interface VoiceSessionPanelProps {
  language: SupportedLanguage;
  scenario: SessionScenario;
  context?: "atelier" | "sprint";
  chatHistory: TeacherRequestMessage[];
  onChatReply: (question: string, answer: string) => void;
}

export function VoiceSessionPanel({
  language,
  scenario,
  context = "atelier",
  chatHistory,
  onChatReply,
}: Readonly<VoiceSessionPanelProps>) {
  const {
    streamNarration,
    askQuestion,
    isNarrating,
    isChatLoading,
    transcript,
    errorMessage,
  } = useAtelierSession(language);
  const { isSpeaking, speak, stop: stopSpeech } = useSpeechSynthesis(language);
  const [isPaused, setIsPaused] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "student" | "teacher"; content: string }>>([]);

  const handleVoiceQuestion = useCallback(
    async (spoken: string) => {
      if (spoken.trim().length === 0) {
        return;
      }
      stopSpeech();
      setIsPaused(true);
      const answer = await askQuestion(scenario.id, spoken, chatHistory);
      if (answer) {
        setChatMessages((prev) => [
          ...prev,
          { role: "student", content: spoken },
          { role: "teacher", content: answer },
        ]);
        onChatReply(spoken, answer);
        speak(answer);
      }
    },
    [askQuestion, scenario.id, chatHistory, onChatReply, speak, stopSpeech],
  );

  const { isListening, start: startListening, stop: stopListening, isSupported: sttSupported } =
    useSpeechRecognition(language, handleVoiceQuestion);

  const startBriefing = async () => {
    setIsPaused(false);
    const text = await streamNarration(scenario.id, { context });
    if (text.trim().length > 0) {
      speak(text);
    }
  };

  const togglePause = () => {
    if (isSpeaking || isNarrating) {
      stopSpeech();
      setIsPaused(true);
      return;
    }
    if (transcript.trim().length > 0) {
      setIsPaused(false);
      speak(transcript);
    }
  };

  const raiseHand = () => {
    stopSpeech();
    setIsPaused(true);
    setChatOpen(true);
    if (sttSupported) {
      startListening();
    }
  };

  const submitChat = async () => {
    const question = chatInput.trim();
    if (question.length === 0) {
      return;
    }
    setChatInput("");
    stopSpeech();
    const answer = await askQuestion(scenario.id, question, chatHistory);
    if (answer) {
      setChatMessages((prev) => [
        ...prev,
        { role: "student", content: question },
        { role: "teacher", content: answer },
      ]);
      onChatReply(question, answer);
    }
  };

  useEffect(() => {
    setChatMessages([]);
    setChatOpen(false);
    setIsPaused(false);
    stopSpeech();
    stopListening();
  }, [scenario.id, stopSpeech, stopListening]);

  return (
    <div className="space-y-4" data-testid="voice-session-panel">
      <TranscriptPanel language={language} transcript={transcript} isStreaming={isNarrating} />

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={startBriefing}
          disabled={isNarrating}
          data-testid="narration-start"
        >
          {t(language, "startNarration")}
        </Button>
        <Button
          variant="secondary"
          onClick={togglePause}
          disabled={transcript.length === 0 && !isSpeaking}
          data-testid="narration-pause"
        >
          {t(language, "pauseNarration")}
        </Button>
        <Button variant="secondary" onClick={raiseHand} data-testid="raise-hand">
          {t(language, "raiseHand")}
          {isListening ? "…" : ""}
        </Button>
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
              className="ircom-input min-h-[var(--ircom-touch-min)] flex-1 rounded-[var(--ircom-radius-md)] px-3 text-sm"
              placeholder={
                language === "fr" ? "Votre question…" : "Your question…"
              }
              data-testid="atelier-chat-input"
            />
            <Button onClick={submitChat} disabled={isChatLoading} data-testid="atelier-chat-send">
              {isChatLoading
                ? language === "fr"
                  ? "Envoi…"
                  : "Sending…"
                : language === "fr"
                  ? "Envoyer"
                  : "Send"}
            </Button>
          </div>
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
        <p className="rounded-[var(--ircom-radius-md)] bg-[#f0587222] p-3 text-sm text-[var(--ircom-red)]" data-testid="error-message">
          {errorMessage}
        </p>
      ) : null}

      {isPaused && !isSpeaking ? (
        <p className="ircom-secondary text-xs" data-testid="session-paused-hint">
          {language === "fr" ? "Session en pause — posez une question ou reprenez l'écoute." : "Session paused — ask a question or resume playback."}
        </p>
      ) : null}
    </div>
  );
}
