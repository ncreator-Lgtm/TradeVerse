import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Circle,
  RotateCcw,
} from "lucide-react";

import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

type CourseRow = {
  course_key: string;
  title: string;
  description: string | null;
  certificate_title: string;
};

type LevelRow = {
  course_key: string;
  level_number: number;
  title: string;
};

type LessonRow = {
  lesson_key: string;
  course_key: string;
  level_number: number;
  lesson_number: number;
  title: string;
};

type ProgressRow = {
  lesson_key: string;
  completion_count: number;
};

type CertificateRow = {
  issued_at: string;
};

export default async function LearnPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    redirect("/login");
  }

  const { data: courseData } = await supabase
    .from("learning_courses")
    .select("course_key, title, description, certificate_title")
    .eq("course_key", "stock_trading")
    .single();

  const { data: levelData } = await supabase
    .from("learning_levels")
    .select("course_key, level_number, title")
    .eq("course_key", "stock_trading")
    .order("level_number");

  const { data: lessonData } = await supabase
    .from("learning_lessons")
    .select(
      "lesson_key, course_key, level_number, lesson_number, title"
    )
    .eq("course_key", "stock_trading")
    .order("level_number")
    .order("lesson_number");

  const { data: progressData } = await supabase
    .from("user_lesson_progress")
    .select("lesson_key, completion_count")
    .eq("user_id", user.id);

  const { data: certificateData } = await supabase
    .from("course_certificates")
    .select("issued_at")
    .eq("user_id", user.id)
    .eq("course_key", "stock_trading")
    .maybeSingle();

  const course = courseData as CourseRow | null;
  const levels = (levelData ?? []) as LevelRow[];
  const lessons = (lessonData ?? []) as LessonRow[];
  const progressRows = (progressData ?? []) as ProgressRow[];
  const certificate = certificateData as CertificateRow | null;

  const progressMap = new Map(
    progressRows.map((progress) => [
      progress.lesson_key,
      progress,
    ])
  );

  const totalLessons = lessons.length;
  const completedLessons = progressRows.length;

  const progressPercent =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

  if (!course) {
    return (
      <AppShell>
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
          Der Kurs konnte nicht geladen werden.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="relative">
        <div className="pointer-events-none absolute -top-24 left-1/3 h-80 w-80 rounded-full bg-purple-600/10 blur-3xl" />

        {/* Kurs-Header */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#101014] p-6 md:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent" />

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-fuchsia-400">
                TradeVerse Academy
              </p>

              <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                {course.title}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                {course.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
                  5 Level
                </span>

                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
                  25 Lektionen
                </span>

                <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs text-purple-300">
                  Zertifikat inklusive
                </span>
              </div>
            </div>

            <div className="min-w-40 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-5">
              <p className="text-xs text-zinc-500">
                Kursfortschritt
              </p>

              <p className="mt-1 text-3xl font-bold">
                {completedLessons}/{totalLessons}
              </p>

              <p className="mt-1 text-sm text-fuchsia-400">
                {progressPercent} %
              </p>
            </div>
          </div>

          <div className="mt-7 h-3 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>
        </section>

        {/* 5 LEVEL */}
        <div className="mt-8 space-y-6">
          {levels.map((level) => {
            const levelLessons = lessons.filter(
              (lesson) =>
                lesson.level_number === level.level_number
            );

            const completedInLevel = levelLessons.filter(
              (lesson) => progressMap.has(lesson.lesson_key)
            ).length;

            const levelComplete =
              completedInLevel === levelLessons.length &&
              levelLessons.length > 0;

            return (
              <section
                key={level.level_number}
                className="rounded-3xl border border-white/10 bg-[#101014] p-5 md:p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-fuchsia-400 uppercase">
                      Level {level.level_number}
                    </p>

                    <h2 className="mt-1 text-xl font-semibold">
                      {level.title}
                    </h2>
                  </div>

                  <div
                    className={`rounded-full px-3 py-1 text-xs ${
                      levelComplete
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-white/5 text-zinc-500"
                    }`}
                  >
                    {completedInLevel}/5
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {levelLessons.map((lesson) => {
                    const lessonProgress = progressMap.get(
                      lesson.lesson_key
                    );

                    const completed = Boolean(lessonProgress);

                    return (
                      <Link
                        key={lesson.lesson_key}
                        href={`/learn/${lesson.lesson_key}`}
                        className={`group flex items-center justify-between gap-4 rounded-2xl border p-4 transition ${
                          completed
                            ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
                            : "border-white/10 bg-black/20 hover:border-fuchsia-500/30 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              completed
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-purple-500/10 text-purple-400"
                            }`}
                          >
                            {completed ? (
                              <CheckCircle2 size={20} />
                            ) : (
                              <Circle size={20} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs text-zinc-600">
                              Lektion {lesson.lesson_number}
                            </p>

                            <p className="mt-0.5 font-medium text-white">
                              {lesson.title}
                            </p>

                            {completed ? (
                              <div className="mt-1 flex items-center gap-2 text-xs text-emerald-400">
                                <RotateCcw size={13} />

                                Wiederholen

                                {lessonProgress &&
                                lessonProgress.completion_count > 1
                                  ? ` · ${lessonProgress.completion_count}× abgeschlossen`
                                  : ""}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <ChevronRight
                          size={19}
                          className="shrink-0 text-zinc-600 transition group-hover:translate-x-1 group-hover:text-fuchsia-400"
                        />
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* ZERTIFIKAT */}
        <section
          className={`mt-8 rounded-3xl border p-6 md:p-8 ${
            certificate
              ? "border-yellow-500/30 bg-yellow-500/5"
              : "border-white/10 bg-[#101014]"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`rounded-2xl p-3 ${
                certificate
                  ? "bg-yellow-500/10 text-yellow-400"
                  : "bg-white/5 text-zinc-500"
              }`}
            >
              <Award size={26} />
            </div>

            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                Kurszertifikat
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                {course.certificate_title}
              </h2>

              {certificate ? (
                <>
                  <p className="mt-2 text-sm text-yellow-300">
                    Zertifikat freigeschaltet
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Ausgestellt am{" "}
                    {new Date(
                      certificate.issued_at
                    ).toLocaleDateString("de-DE")}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-zinc-500">
                  Schließe alle 25 Lektionen ab, um dein
                  TradeVerse-Zertifikat zu erhalten.
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="mt-8 flex items-center gap-2 text-sm text-zinc-600">
          <BookOpen size={16} />
          Abgeschlossene Lektionen können jederzeit wiederholt werden.
        </div>
      </div>
    </AppShell>
  );
}