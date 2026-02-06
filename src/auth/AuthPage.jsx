import React, { useMemo, useState } from "react";
import { supabase, isConfigured } from "@/lib/supabase";
import { AlertCircle, Key, Info } from "lucide-react";

function friendlyAuthError(err) {
  const message = err?.message || "";
  if (message.includes("Invalid login credentials")) return "Incorrect email or password.";
  if (message.includes("Email not confirmed")) return "Please confirm your email address.";
  if (message.includes("User already registered")) return "That email is already in use. Try signing in instead.";
  return message || "Something went wrong. Please try again.";
}

export default function AuthPage() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const title = useMemo(() => (mode === "signin" ? "Sign in" : "Create account"), [mode]);

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-hff-bg font-sans text-gray-900 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuration Required</h1>
              <p className="text-gray-500">Supabase environment variables are missing.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Why is this happening?</p>
                  <p>The application is secured with Supabase Auth, but it hasn't been linked to your Supabase project yet. This is why you're seeing this page instead of the login screen.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Info className="h-5 w-5 text-hff-primary" />
                How to fix this:
              </h2>
              <ol className="list-decimal list-inside space-y-3 text-sm text-gray-600 pl-2">
                <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-hff-primary font-medium hover:underline">Supabase Dashboard</a>.</li>
                <li>Go to <strong>Project Settings</strong> &gt; <strong>API</strong>.</li>
                <li>Copy the <strong>Project URL</strong> and <strong>Anon Key</strong>.</li>
                <li>Open your <code>.env.local</code> file in the project root.</li>
                <li>Paste the values into <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.</li>
                <li><strong>Restart</strong> the development server.</li>
              </ol>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400">Need help? Reference <code>.env.example</code> for the correct format.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setMessage("Check your email for the confirmation link!");
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
      const { error: err } = await supabase.auth.resetPasswordForEmail(email);
      if (err) throw err;
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

