import { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="auth-layout">
      <section className="auth-panel" aria-label="Authentication">
        <div className="auth-copy">
          <p className="auth-eyebrow">CATALYST AUTHENTICATION</p>
          <h1>Crime Intelligence Portal</h1>
          <p>
            Secure access for Karnataka State Police crime intelligence workflows.
          </p>
        </div>
        <div className="auth-card">{children}</div>
      </section>
    </main>
  );
}
