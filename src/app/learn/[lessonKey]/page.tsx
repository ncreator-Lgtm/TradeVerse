import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  Trophy,
} from "lucide-react";

import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

type LessonRow = {
  lesson_key: string;
  course_key: string;
  level_number: number;
  lesson_number: number;
  title: string;
};

type ProgressRow = {
  completion_count: number;
  first_completed_at: string;
  last_completed_at: string;
};

type CompletionResult = {
  first_completion: boolean;
  completion_count: number;
  quest_completed: boolean;
  xp_awarded: number;
  total_xp: number;
  course_completed: boolean;
  certificate_issued: boolean;
};

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonKey: string }>;
  searchParams: Promise<{
    quiz?: string;
    done?: string;
    first?: string;
    xp?: string;
    count?: string;
    certificate?: string;
  }>;
}) {
  const { lessonKey } = await params;
  const query = await searchParams;

  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    redirect("/login");
  }

  const { data: lessonData } = await supabase
    .from("learning_lessons")
    .select(
      "lesson_key, course_key, level_number, lesson_number, title"
    )
    .eq("lesson_key", lessonKey)
    .maybeSingle();

  if (!lessonData) {
    notFound();
  }

  const lesson = lessonData as LessonRow;

  const { data: progressData } = await supabase
    .from("user_lesson_progress")
    .select(
      "completion_count, first_completed_at, last_completed_at"
    )
    .eq("user_id", user.id)
    .eq("lesson_key", lessonKey)
    .maybeSingle();

  const progress = progressData as ProgressRow | null;

  // Vorerst hat nur die erste Lektion vollständigen Inhalt.
  const isFirstLesson = lessonKey === "stock_01_01";

  async function completeLesson(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      redirect("/login");
    }

    // Quiz für Lektion 1 serverseitig prüfen
    if (lessonKey === "stock_01_01") {
      const q1 = formData.get("q1");
      const q2 = formData.get("q2");
      const q3 = formData.get("q3");

      const correct =
        q1 === "ownership" &&
        q2 === "price-change" &&
        q3 === "risk";

      if (!correct) {
        redirect(`/learn/${lessonKey}?quiz=retry`);
      }
    }

    const { data, error } = await supabase.rpc(
      "complete_learning_lesson",
      {
        p_lesson_key: lessonKey,
      }
    );

    if (error) {
      redirect(`/learn/${lessonKey}?quiz=error`);
    }

    const result =
      (data?.[0] ?? null) as CompletionResult | null;

    if (!result) {
      redirect(`/learn/${lessonKey}?quiz=error`);
    }

    revalidatePath("/learn");
    revalidatePath("/dashboard");
    revalidatePath(`/learn/${lessonKey}`);

    const parameters = new URLSearchParams({
      done: "1",
      first: result.first_completion ? "1" : "0",
      xp: String(result.xp_awarded),
      count: String(result.completion_count),
      certificate: result.certificate_issued ? "1" : "0",
    });

    redirect(`/learn/${lessonKey}?${parameters.toString()}`);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={17} />
          Zurück zum Kurs
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium text-fuchsia-400">
            Aktienhandel · Level {lesson.level_number} · Lektion{" "}
            {lesson.lesson_number}
          </p>

          <h1 className="mt-2 text-3xl font-bold md:text-4xl">
            {lesson.title}
          </h1>
        </div>

        {query.done === "1" ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
            <div className="flex gap-3">
              <CheckCircle2
                size={22}
                className="mt-0.5 shrink-0 text-emerald-400"
              />

              <div>
                <p className="font-semibold text-emerald-300">
                  {query.first === "1"
                    ? "Lektion abgeschlossen!"
                    : "Lektion erfolgreich wiederholt!"}
                </p>

                {Number(query.xp ?? 0) > 0 ? (
                  <p className="mt-1 text-sm text-emerald-300/70">
                    Tagesquest erfüllt · +{query.xp} XP
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-emerald-300/70">
                    Die heutige Lernquest war bereits abgeschlossen.
                  </p>
                )}

                <p className="mt-2 text-xs text-zinc-500">
                  Diese Lektion wurde insgesamt {query.count}× abgeschlossen.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {query.quiz === "retry" ? (
          <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 text-sm text-orange-300">
            Noch nicht ganz. Prüfe deine Antworten und versuche das Quiz
            erneut.
          </div>
        ) : null}

        {query.quiz === "error" ? (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            Der Abschluss konnte nicht gespeichert werden. Bitte versuche es
            erneut.
          </div>
        ) : null}

        {progress ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <RotateCcw size={19} className="text-fuchsia-400" />

            <div>
              <p className="text-sm font-medium">
                Bereits abgeschlossen
              </p>

              <p className="text-xs text-zinc-500">
                {progress.completion_count}× abgeschlossen · Du kannst diese
                Lektion jederzeit wiederholen.
              </p>
            </div>
          </div>
        ) : null}

        {isFirstLesson ? (
          <>
            <section className="mt-8 space-y-5">
              <article className="rounded-3xl border border-white/10 bg-[#101014] p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-purple-500/10 p-2 text-purple-400">
                    <BookOpen size={21} />
                  </div>

                  <h2 className="text-xl font-semibold">
                    Was bedeutet Aktienhandel?
                  </h2>
                </div>

                <p className="mt-5 leading-7 text-zinc-300">
                  Beim Aktienhandel werden Aktien von Unternehmen gekauft und
                  verkauft. Eine Aktie stellt vereinfacht gesagt einen kleinen
                  Eigentumsanteil an einem Unternehmen dar.
                </p>

                <p className="mt-4 leading-7 text-zinc-400">
                  Wenn du beispielsweise Aktien eines börsennotierten
                  Unternehmens kaufst, besitzt du einen sehr kleinen Teil
                  dieses Unternehmens. Der Marktpreis dieser Aktie kann sich
                  ständig verändern.
                </p>
              </article>

              <article className="rounded-3xl border border-white/10 bg-[#101014] p-6 md:p-8">
                <h2 className="text-xl font-semibold">
                  Wie können Gewinne und Verluste entstehen?
                </h2>

                <p className="mt-5 leading-7 text-zinc-400">
                  Kaufst du eine Aktie für 50 € und ihr Marktpreis steigt später
                  auf 60 €, ist deine Position auf dem Papier 10 € mehr wert.
                  Fällt der Kurs dagegen auf 40 €, ist sie 10 € weniger wert.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5">
                    <p className="text-sm text-emerald-400">
                      Beispiel Kursanstieg
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      50 € → 60 €
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      Unrealisierter Gewinn: +10 €
                    </p>
                  </div>

                  <div className="rounded-2xl border border-red-500/15 bg-red-500/5 p-5">
                    <p className="text-sm text-red-400">
                      Beispiel Kursrückgang
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      50 € → 40 €
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      Unrealisierter Verlust: −10 €
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-white/10 bg-[#101014] p-6 md:p-8">
                <h2 className="text-xl font-semibold">
                  Trading und Investieren
                </h2>

                <p className="mt-5 leading-7 text-zinc-400">
                  Die Begriffe überschneiden sich, beschreiben aber häufig
                  unterschiedliche Ansätze. Trading konzentriert sich oft
                  stärker auf kürzere Kursbewegungen. Investieren verfolgt
                  typischerweise einen längeren Zeithorizont.
                </p>

                <p className="mt-4 leading-7 text-zinc-400">
                  Beide Ansätze beinhalten Risiken. Kursentwicklungen sind
                  nicht garantiert und vergangene Entwicklungen sagen nicht
                  zuverlässig voraus, was in Zukunft passiert.
                </p>
              </article>

              <article className="rounded-3xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-6">
                <p className="text-sm font-semibold text-fuchsia-300">
                  Merke
                </p>

                <p className="mt-2 leading-7 text-zinc-300">
                  Eine Aktie ist ein Anteil an einem Unternehmen. Ihr
                  Marktpreis kann steigen oder fallen. Deshalb gehören
                  Chancen und Risiken immer zusammen.
                </p>
              </article>
            </section>

            <form
              action={completeLesson}
              className="mt-8 rounded-3xl border border-white/10 bg-[#101014] p-6 md:p-8"
            >
              <div className="flex items-center gap-3">
                <Trophy size={22} className="text-yellow-400" />

                <div>
                  <h2 className="text-xl font-semibold">
                    Wissenscheck
                  </h2>

                  <p className="text-sm text-zinc-500">
                    Beantworte alle drei Fragen richtig.
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-8">
                <fieldset>
                  <legend className="font-medium">
                    1. Was stellt eine Aktie vereinfacht dar?
                  </legend>

                  <div className="mt-3 space-y-2">
                    <label className="flex cursor-pointer gap-3 rounded-xl border border-white/10 p-3 hover:bg-white/5">
                      <input
                        type="radio"
                        name="q1"
                        value="ownership"
                        required
                      />
                      Einen Eigentumsanteil an einem Unternehmen
                    </label>

                    <label className="flex cursor-pointer gap-3 rounded-xl border border-white/10 p-3 hover:bg-white/5">
                      <input
                        type="radio"
                        name="q1"
                        value="loan"
                        required
                      />
                      Einen automatisch garantierten Kredit
                    </label>
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="font-medium">
                    2. Wie kann sich der Wert einer Aktienposition verändern?
                  </legend>

                  <div className="mt-3 space-y-2">
                    <label className="flex cursor-pointer gap-3 rounded-xl border border-white/10 p-3 hover:bg-white/5">
                      <input
                        type="radio"
                        name="q2"
                        value="fixed"
                        required
                      />
                      Der Wert bleibt grundsätzlich immer gleich
                    </label>

                    <label className="flex cursor-pointer gap-3 rounded-xl border border-white/10 p-3 hover:bg-white/5">
                      <input
                        type="radio"
                        name="q2"
                        value="price-change"
                        required
                      />
                      Durch steigende oder fallende Marktpreise
                    </label>
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="font-medium">
                    3. Welche Aussage ist richtig?
                  </legend>

                  <div className="mt-3 space-y-2">
                    <label className="flex cursor-pointer gap-3 rounded-xl border border-white/10 p-3 hover:bg-white/5">
                      <input
                        type="radio"
                        name="q3"
                        value="guaranteed"
                        required
                      />
                      Gewinne beim Aktienhandel sind garantiert
                    </label>

                    <label className="flex cursor-pointer gap-3 rounded-xl border border-white/10 p-3 hover:bg-white/5">
                      <input
                        type="radio"
                        name="q3"
                        value="risk"
                        required
                      />
                      Aktienhandel beinhaltet Chancen und Risiken
                    </label>
                  </div>
                </fieldset>
              </div>

              <button
                type="submit"
                className="mt-8 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-4 font-semibold text-white transition hover:opacity-90"
              >
                {progress
                  ? "Lektion wiederholen"
                  : "Lektion abschließen"}
              </button>
            </form>
          </>
        ) : (
          <section className="mt-8 rounded-3xl border border-white/10 bg-[#101014] p-8 text-center">
            <BookOpen
              size={32}
              className="mx-auto text-purple-400"
            />

            <h2 className="mt-4 text-xl font-semibold">
              Diese Lektion wird vorbereitet
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
              Die Kursstruktur ist bereits vorhanden. Den vollständigen
              Lerninhalt dieser Lektion bauen wir als Nächstes.
            </p>
          </section>
        )}

        <div className="mt-8">
          <Link
            href="/learn"
            className="text-sm text-fuchsia-400 hover:text-fuchsia-300"
          >
            ← Zur Kursübersicht
          </Link>
        </div>
      </div>
    </AppShell>
  );
}