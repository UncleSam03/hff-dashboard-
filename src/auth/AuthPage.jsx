import React, { useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

function friendlyAuthError(err) {
  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/missing-password":
      return "Please enter a password.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/email-already-in-use":
      return "That email is already in use. Try signing in instead.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    default:
      return err?.message || "Something went wrong. Please try again.";
  }
}

export default function AuthPage() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const title = useMemo(() => (mode === "signin" ? "Sign in" : "Create account"), [mode]);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      } else {
        await createUserWithEmailAndPassword(firebaseAuth, email, password);
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onForgotPassword() {
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      if (!email) {
        setError("Enter your email above first, then click “Reset password”.");
        return;
      }
      await sendPasswordResetEmail(firebaseAuth, email);
      setMessage("Password reset email sent (check your inbox/spam).");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-hff-bg font-sans text-gray-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">HFF Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">{title} to continue.</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError("");
              setMessage("");
            }}
            className={[
              "flex-1 rounded-lg px-3 py-2 text-sm font-semibold border transition",
              mode === "signin"
                ? "bg-hff-primary text-white border-hff-primary"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
            ].join(" ")}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
              setMessage("");
            }}
            className={[
              "flex-1 rounded-lg px-3 py-2 text-sm font-semibold border transition",
              mode === "signup"
                ? "bg-hff-primary text-white border-hff-primary"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
            ].join(" ")}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-hff-primary/40"
              placeholder="you@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-hff-primary/40"
              placeholder="••••••••"
              required
            />
          </div>

          {error ? (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-hff-primary text-white font-semibold px-3 py-2 hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          {mode === "signin" ? (
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={submitting}
              className="w-full text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-60"
            >
              Reset password
            </button>
          ) : null}
        </form>
      </div>
    </div>
  );
}

