import { z } from "zod";

export const supportedLanguages = ["fr", "en"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const teacherModes = ["coach", "exercise", "sprint"] as const;
export type TeacherMode = (typeof teacherModes)[number];

export const exerciseTabs = ["visual", "script"] as const;
export type ExerciseTab = (typeof exerciseTabs)[number];

export interface ModeProgress {
  interactionsCompleted: number;
  lastUpdatedAtIso: string | null;
}

export interface StudentProgress {
  coach: ModeProgress;
  exercise: ModeProgress;
  sprint: ModeProgress;
}

export interface TeacherRequestMessage {
  role: "student" | "teacher";
  content: string;
}

export interface BriefFields {
  role: string;
  context: string;
  objective: string;
  constraints: string;
  format: string;
}

export const briefFieldsSchema = z.object({
  role: z.string().max(500),
  context: z.string().max(2000),
  objective: z.string().max(1000),
  constraints: z.string().max(1000),
  format: z.string().max(500),
});

export const teacherRequestSchema = z.object({
  mode: z.enum(teacherModes),
  language: z.enum(supportedLanguages),
  studentInput: z.string().trim().min(1).max(8000),
  interactionNumber: z.number().int().min(1).max(50),
  history: z
    .array(
      z.object({
        role: z.enum(["student", "teacher"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .max(12),
  briefFields: briefFieldsSchema.optional(),
  imageBase64: z.string().max(6_000_000).optional(),
  imageMimeType: z.string().max(64).optional(),
  exerciseTab: z.enum(exerciseTabs).optional(),
  sourceTool: z.string().max(32).optional(),
});

export const rubricScoresSchema = z.object({
  strategic: z.number().int().min(0).max(100),
  workflow: z.number().int().min(0).max(100),
  critical: z.number().int().min(0).max(100),
});

export const teacherResponseSchema = z.object({
  title: z.string().min(1),
  feedback: z.string().min(1),
  nextStep: z.string().min(1),
  critiqueChecklist: z.array(z.string().min(1)).min(3).max(8),
  deliverableChecklist: z.array(z.string().min(1)).max(10).optional(),
  rubricScores: rubricScoresSchema.optional(),
  visualNotes: z.array(z.string().min(1)).max(6).optional(),
  qualityScore: z.number().int().min(0).max(100).optional(),
  recommendedTool: z.string().max(64).optional(),
});

export type TeacherRequestInput = z.infer<typeof teacherRequestSchema>;
export type TeacherResponseOutput = z.infer<typeof teacherResponseSchema>;
