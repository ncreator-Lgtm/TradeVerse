import Link from "next/link";
import { BrandMark, primaryButtonClassName } from "@/components/auth-shell";

export default function Home() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-20%] left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-violet-600/25 blur-3xl" />
        <div className="absolute right-[-10%] bottom-[-10%] h-96 w-96 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(ellipse_at_center,black,transparent_72%)]" />
      </div>
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <BrandMark />
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition hover:text-white"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-linear-to-r from-violet-600 to-pink-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Join
          </Link>
        </div>
      </header>
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-20">
        <p className="text-[11px] font-medium tracking-[0.32em] text-fuchsia-300 uppercase">
          Simulated market arena
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          Trade like it&apos;s a game.
          <span className="block bg-linear-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
            Compete like it&apos;s capital.
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-zinc-400">
          Open a personal book with 100.000 € paper cash. Rank climbs, rival
          desks, and live quotes come next — first, claim your handle.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className={`${primaryButtonClassName} sm:w-auto sm:px-8`}
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 px-8 text-sm font-semibold text-white transition hover:border-fuchsia-400/50"
          >
            Enter dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
