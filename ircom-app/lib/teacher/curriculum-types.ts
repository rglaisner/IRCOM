import { z } from "zod";

export const courseSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  markdown: z.string().min(1),
});

export const courseBlocSchema = z.object({
  id: z.number().int().min(1).max(3),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  sections: z.array(courseSectionSchema).min(1),
});

export const courseContentSchema = z.object({
  blocs: z.array(courseBlocSchema).length(3),
});

export const narrateBriefingStepSchema = z.object({
  type: z.literal("narrate"),
  id: z.string().min(1),
  hint: z.string().min(1),
});

export const deliverableCheckpointStepSchema = z.object({
  type: z.literal("deliverable_checkpoint"),
  id: z.string().min(1),
  prompt: z.string().min(1),
  expectedShape: z.string().min(1),
  voiceCue: z.string().min(1),
});

export const briefingStepSchema = z.discriminatedUnion("type", [
  narrateBriefingStepSchema,
  deliverableCheckpointStepSchema,
]);

export type BriefingStep = z.infer<typeof briefingStepSchema>;

export const atelierScenarioSchema = z.object({
  id: z.string().min(1),
  blocId: z.number().int().min(1).max(3),
  title: z.string().min(1),
  summary: z.string().min(1),
  situation: z.string().min(1),
  constraints: z.array(z.string().min(1)).min(1),
  deliverables: z.array(z.string().min(1)).min(1),
  narrationScript: z.string().min(1),
  linkedCourseSectionIds: z.array(z.string().min(1)),
  recommendedTools: z.array(z.string().min(1)),
  allowsImageUpload: z.boolean().optional(),
  briefingSteps: z.array(briefingStepSchema).optional(),
});

export const atelierContentSchema = z.object({
  scenarios: z.array(atelierScenarioSchema).min(1),
});

export const sprintScenarioSchema = z.object({
  id: z.string().min(1),
  letter: z.enum(["A", "B", "C"]),
  title: z.string().min(1),
  inspiration: z.string().min(1),
  situation: z.string().min(1),
  constraints: z.array(z.string().min(1)).min(1),
  deliverables: z.array(z.string().min(1)).min(1),
  critiqueFocus: z.string().min(1),
  briefMarkdown: z.string().min(1),
  narrationScript: z.string().min(1),
  deliverableChecklist: z.array(z.string().min(1)).min(1),
  interactionScripts: z.object({
    "1": z.string().min(1),
    "2": z.string().min(1),
  }),
  recommendedTools: z.array(z.string().min(1)),
});

export const sprintContentSchema = z.object({
  scenarios: z.array(sprintScenarioSchema).length(3),
});

export type CourseSection = z.infer<typeof courseSectionSchema>;
export type CourseBloc = z.infer<typeof courseBlocSchema>;
export type CourseContent = z.infer<typeof courseContentSchema>;
export type AtelierScenario = z.infer<typeof atelierScenarioSchema>;
export type AtelierContent = z.infer<typeof atelierContentSchema>;
export type SprintScenario = z.infer<typeof sprintScenarioSchema>;
export type SprintContent = z.infer<typeof sprintContentSchema>;
