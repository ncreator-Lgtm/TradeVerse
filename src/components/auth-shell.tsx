import type { ReactNode } from "react";
import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3">
      <span className="relative grid h-9 w-9 place-items-center rounded-lg bg-linear-to-br from-violet-500 to-pink-500 shadow-[0_0_24px_rgba(168,85,247,0.45)]">
        <span className="font-mono text-sm font-bold tracking-tight text-white">
          TV
        </span>
      </span>
      <span className={compact ? "hidden sm:block" : "block"}>
        <span className="block font-semibold tracking-[0.22em] text-white uppercase">
          TradeVerse
        </span>
        <span className="block text-[11px] tracking-[0.18em] text-zinc-400 uppercase">
          Market arena
        </span>
      </span>
    </Link>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-600/25 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-pink-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[48px_48px] mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <BrandMark />
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-8 shadow-[0_0_80px_rgba(168,85,247,0.12)] backdrop-blur-xl">
          <p className="mb-2 text-[11px] font-medium tracking-[0.28em] text-fuchsia-300 uppercase">
            Access terminal
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">{footer}</p>
      </div>
    </div>
  );
}

export const fieldClassName =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-400/70 focus:ring-2 focus:ring-violet-500/30";

export const labelClassName =
  "text-xs font-medium tracking-[0.16em] text-zinc-400 uppercase";

export const primaryButtonClassName =
  "inline-flex h-12 w-full items-center justify-center rounded-xl bg-linear-to-r from-violet-600 to-pink-500 text-sm font-semibold text-white shadow-[0_0_28px_rgba(236,72,153,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";
