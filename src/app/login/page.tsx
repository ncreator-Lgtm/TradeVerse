import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with email and password to open your personal book."
      footer={
        <>
          New to the arena?{" "}
          <Link
            href="/register"
            className="font-medium text-fuchsia-300 hover:text-white"
          >
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
