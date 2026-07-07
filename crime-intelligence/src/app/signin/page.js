import { redirect } from "next/navigation";

// Fallback legacy route redirecting to the active login route
export default function SignInPage() {
  redirect("/login");
}

