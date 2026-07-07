import { AuthPageGuard } from "@/components/auth/AuthPageGuard";
import { AuthShell } from "@/components/auth/AuthShell";
import { CatalystLoginFrame } from "@/components/auth/CatalystLoginFrame";

export default function LoginPage() {
  return (
    <AuthPageGuard>
      <AuthShell>
        <CatalystLoginFrame />
      </AuthShell>
    </AuthPageGuard>
  );
}
