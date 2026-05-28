import courseEn from "@/content/course.en.json";
import courseFr from "@/content/course.fr.json";
import {
  courseContentSchema,
  type CourseBloc,
  type CourseContent,
  type CourseSection,
} from "@/lib/teacher/curriculum-types";
import type { SupportedLanguage } from "@/lib/teacher/types";

const courseByLanguage: Record<SupportedLanguage, CourseContent> = {
  fr: courseContentSchema.parse(courseFr),
  en: courseContentSchema.parse(courseEn),
};

export function getCourseContent(language: SupportedLanguage): CourseContent {
  return courseByLanguage[language];
}

export function getCourseBloc(
  language: SupportedLanguage,
  blocId: number,
): CourseBloc | undefined {
  return getCourseContent(language).blocs.find((bloc) => bloc.id === blocId);
}

export function getCourseSection(
  language: SupportedLanguage,
  blocId: number,
  sectionId: string,
): CourseSection | undefined {
  const bloc = getCourseBloc(language, blocId);
  return bloc?.sections.find((section) => section.id === sectionId);
}
