import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Join TradeVerse"
      subtitle="Create your handle, fund a personal book with 100.000 € paper cash, and start competing."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-fuchsia-300 hover:text-white"
          >
            Log in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
