import { z } from "zod";

export const supportedLanguages = ["fr", "en"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const teacherModes = ["coach", "exercise", "sprint"] as const;
export type TeacherMode = (typeof teacherModes)[number];

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

export interface TeacherRequest {
  mode: TeacherMode;
  language: SupportedLanguage;
  studentInput: string;
  interactionNumber: number;
  history: TeacherRequestMessage[];
}

export interface TeacherResponse {
  title: string;
  feedback: string;
  nextStep: string;
  critiqueChecklist: string[];
}

export const teacherRequestSchema = z.object({
  mode: z.enum(teacherModes),
  language: z.enum(supportedLanguages),
  studentInput: z.string().trim().min(1).max(5000),
  interactionNumber: z.number().int().min(1).max(50),
  history: z
    .array(
      z.object({
        role: z.enum(["student", "teacher"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .max(12),
});

export const teacherResponseSchema = z.object({
  title: z.string().min(1),
  feedback: z.string().min(1),
  nextStep: z.string().min(1),
  critiqueChecklist: z.array(z.string().min(1)).min(3).max(6),
});

export type TeacherRequestInput = z.infer<typeof teacherRequestSchema>;
export type TeacherResponseOutput = z.infer<typeof teacherResponseSchema>;
