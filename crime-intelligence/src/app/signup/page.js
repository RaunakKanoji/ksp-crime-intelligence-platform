import { AuthPageGuard } from "@/components/auth/AuthPageGuard";
import { AuthShell } from "@/components/auth/AuthShell";
import { CatalystSignupFrame } from "@/components/auth/CatalystSignupFrame";

export default function SignupPage() {
  return (
    <AuthPageGuard>
      <AuthShell>
        <CatalystSignupFrame />
      </AuthShell>
    </AuthPageGuard>
  );
}
