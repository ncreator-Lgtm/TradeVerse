"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  hasFieldErrors,
  readString,
  validateCredentials,
  validateRegistration,
  type AuthState,
} from "@/lib/auth/validation";
import { ensureProfileAndPortfolio } from "@/lib/supabase/user-data";

export async function register(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = readString(formData, "username").toLowerCase();
  const displayName = readString(formData, "displayName");
  const email = readString(formData, "email").toLowerCase();
  const password = typeof formData.get("password") === "string"
    ? (formData.get("password") as string)
    : "";

  const fieldErrors = validateRegistration({
    username,
    displayName,
    email,
    password,
  });

  if (hasFieldErrors(fieldErrors)) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: displayName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user && data.session) {
    await ensureProfileAndPortfolio(supabase, data.user);
    redirect("/dashboard");
  }

  return {
    message: "Account created. Confirm your email, then log in.",
  };
}

export async function login(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = readString(formData, "email").toLowerCase();
  const password = typeof formData.get("password") === "string"
    ? (formData.get("password") as string)
    : "";

  const fieldErrors = validateCredentials(email, password);
  if (hasFieldErrors(fieldErrors)) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await ensureProfileAndPortfolio(supabase, data.user);
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
