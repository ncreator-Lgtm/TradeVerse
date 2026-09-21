"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import type { AuthState } from "@/lib/auth/validation";
import {
  fieldClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/auth-shell";

const initialState: AuthState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="email" className={labelClassName}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={fieldClassName}
          placeholder="you@tradeverse.app"
        />
        {state.fieldErrors?.email ? (
          <p className="mt-2 text-sm text-pink-400">{state.fieldErrors.email}</p>
        ) : null}
      </div>
      <div>
        <label htmlFor="password" className={labelClassName}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className={fieldClassName}
          placeholder="••••••••"
        />
        {state.fieldErrors?.password ? (
          <p className="mt-2 text-sm text-pink-400">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>
      {state.error ? (
        <p className="rounded-lg border border-pink-500/30 bg-pink-500/10 px-3 py-2 text-sm text-pink-200">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm text-violet-100">
          {state.message}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={primaryButtonClassName}>
        {pending ? "Entering..." : "Enter dashboard"}
      </button>
    </form>
  );
}
