import { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-app-background px-6 py-10 text-ink-primary">
      <section className="w-full max-w-[840px]">
        {children}
      </section>
    </main>
  );
}
