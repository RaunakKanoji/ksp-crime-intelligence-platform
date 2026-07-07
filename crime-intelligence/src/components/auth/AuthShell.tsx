import { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-6 py-10 text-black">
      <section className="w-full max-w-[840px]">
        {children}
      </section>
    </main>
  );
}
