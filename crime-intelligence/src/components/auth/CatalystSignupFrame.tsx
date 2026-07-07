"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signUpCatalystUser } from "@/lib/catalyst/client";

export function CatalystSignupFrame() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!lastName.trim() || !email.trim()) {
      setError("Last name and email address are required.");
      return;
    }

    setSubmitting(true);

    try {
      await signUpCatalystUser({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim(),
        email: email.trim(),
      });
      setSuccess(
        "Signup request submitted. Check your email to complete account setup.",
      );
      setFirstName("");
      setLastName("");
      setEmail("");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
        "Unable to submit signup through Catalyst. Confirm public signup is enabled for this Catalyst project.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card auth-card-login">
      <h2 className="auth-card-heading">Sign up</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          aria-label="First name"
          name="firstName"
          type="text"
          placeholder="First name"
          autoComplete="given-name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
        <input
          aria-label="Last name"
          name="lastName"
          type="text"
          placeholder="Last name"
          autoComplete="family-name"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          required
        />
        <input
          aria-label="Email address"
          name="email"
          type="email"
          placeholder="Please enter your email address"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        {error ? <p className="auth-form-message auth-form-error">{error}</p> : null}
        {success ? <p className="auth-form-message auth-form-success">{success}</p> : null}
        <button type="submit" disabled={submitting}>
          {submitting ? "SUBMITTING..." : "SIGN UP"}
        </button>
      </form>
      <p className="auth-bottom-link">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-black underline"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}
