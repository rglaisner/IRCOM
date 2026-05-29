import type { BriefingStep } from "@/lib/teacher/curriculum-types";
import type { AtelierScenario } from "@/lib/teacher/curriculum-types";
import { z } from "zod";

export type { BriefingStep };

export type BriefingOrchestratorState =
  | "idle"
  | "narrating"
  | "awaitingDeliverable"
  | "complete";

export interface BriefingOrchestratorSnapshot {
  steps: BriefingStep[];
  stepIndex: number;
  state: BriefingOrchestratorState;
  currentStep: BriefingStep | null;
  isCheckpointActive: boolean;
  checkpointPrompt: string | null;
}

export function resolveBriefingSteps(scenario: AtelierScenario): BriefingStep[] {
  if (scenario.briefingSteps && scenario.briefingSteps.length > 0) {
    return scenario.briefingSteps;
  }

  return [
    {
      type: "narrate",
      id: "full-briefing",
      hint: scenario.narrationScript,
    },
  ];
}

export function createBriefingOrchestratorSnapshot(
  scenario: AtelierScenario,
  stepIndex = 0,
  state: BriefingOrchestratorState = "idle",
): BriefingOrchestratorSnapshot {
  const steps = resolveBriefingSteps(scenario);
  const boundedIndex = Math.min(Math.max(stepIndex, 0), Math.max(steps.length - 1, 0));
  const currentStep = steps[boundedIndex] ?? null;

  return {
    steps,
    stepIndex: boundedIndex,
    state,
    currentStep,
    isCheckpointActive:
      state === "awaitingDeliverable" && currentStep?.type === "deliverable_checkpoint",
    checkpointPrompt:
      currentStep?.type === "deliverable_checkpoint" ? currentStep.prompt : null,
  };
}

export function advanceAfterNarration(
  snapshot: BriefingOrchestratorSnapshot,
): BriefingOrchestratorSnapshot {
  const nextIndex = snapshot.stepIndex + 1;
  if (nextIndex >= snapshot.steps.length) {
    return { ...snapshot, state: "complete" };
  }

  const nextStep = snapshot.steps[nextIndex];
  if (nextStep?.type === "deliverable_checkpoint") {
    return createBriefingOrchestratorSnapshotFromSteps(snapshot.steps, nextIndex, "awaitingDeliverable");
  }

  return createBriefingOrchestratorSnapshotFromSteps(snapshot.steps, nextIndex, "narrating");
}

export function markDeliverableSubmitted(
  snapshot: BriefingOrchestratorSnapshot,
): BriefingOrchestratorSnapshot {
  return advanceAfterNarration(snapshot);
}

function createBriefingOrchestratorSnapshotFromSteps(
  steps: BriefingStep[],
  stepIndex: number,
  state: BriefingOrchestratorState,
): BriefingOrchestratorSnapshot {
  const boundedIndex = Math.min(Math.max(stepIndex, 0), Math.max(steps.length - 1, 0));
  const currentStep = steps[boundedIndex] ?? null;

  return {
    steps,
    stepIndex: boundedIndex,
    state,
    currentStep,
    isCheckpointActive:
      state === "awaitingDeliverable" && currentStep?.type === "deliverable_checkpoint",
    checkpointPrompt:
      currentStep?.type === "deliverable_checkpoint" ? currentStep.prompt : null,
  };
}

export function startBriefingOrchestration(
  scenario: AtelierScenario,
): BriefingOrchestratorSnapshot {
  const steps = resolveBriefingSteps(scenario);
  const firstStep = steps[0];
  if (firstStep?.type === "deliverable_checkpoint") {
    return createBriefingOrchestratorSnapshotFromSteps(steps, 0, "awaitingDeliverable");
  }
  return createBriefingOrchestratorSnapshotFromSteps(steps, 0, "narrating");
}
