"use client";

import React, { useEffect, useState } from "react";
import { Lock, LogOut, ShieldAlert, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { User } from "@/lib/types";

interface PortalAuthGateProps {
  requiredRole: "teacher" | "admin";
  portalTitle: string;
  portalSubtitle: string;
  children: React.ReactNode;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function getStorageKey(role: "teacher" | "admin"): string {
  return `acadpulse_portal_auth_${role}`;
}

export function PortalAuthGate({
  requiredRole,
  portalTitle,
  portalSubtitle,
  children,
}: PortalAuthGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const verifyStoredSession = async () => {
      try {
        const raw = sessionStorage.getItem(getStorageKey(requiredRole));
        if (!raw) {
          setChecking(false);
          return;
        }
        const parsed = JSON.parse(raw) as { token?: string };
        if (!parsed.token) {
          sessionStorage.removeItem(getStorageKey(requiredRole));
          setChecking(false);
          return;
        }

        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${parsed.token}` },
        });
        if (!res.ok) {
          sessionStorage.removeItem(getStorageKey(requiredRole));
          setChecking(false);
          return;
        }

        const me = (await res.json()) as User;
        if (me.role !== requiredRole) {
          sessionStorage.removeItem(getStorageKey(requiredRole));
          setError(
            `Access Denied (403): Signed-in account has role "${me.role}", but this portal requires "${requiredRole}".`
          );
          setChecking(false);
          return;
        }

        setUser(me);
      } catch {
        sessionStorage.removeItem(getStorageKey(requiredRole));
      } finally {
        setChecking(false);
      }
    };

    verifyStoredSession();
  }, [requiredRole]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const formBody = new URLSearchParams();
      formBody.append("username", email.trim());
      formBody.append("password", password);

      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody.toString(),
      });

      if (!loginRes.ok) {
        const errData = await loginRes.json().catch(() => null);
        setError(
          errData?.detail ?? "Invalid credentials. Please check your email and password."
        );
        setSubmitting(false);
        return;
      }

      const tokenPayload = (await loginRes.json()) as { access_token: string };

      const meRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
      });

      if (!meRes.ok) {
        setError("Could not verify account role with the authentication service.");
        setSubmitting(false);
        return;
      }

      const me = (await meRes.json()) as User;
      if (me.role !== requiredRole) {
        setError(
          `Access Denied (403): Your account role is "${me.role}". Only "${requiredRole}" accounts may access this portal.`
        );
        setSubmitting(false);
        return;
      }

      sessionStorage.setItem(
        getStorageKey(requiredRole),
        JSON.stringify({ token: tokenPayload.access_token })
      );
      setUser(me);
      setPassword("");
    } catch {
      setError(
        `Authentication server unreachable at ${API_BASE}. Start the FastAPI backend to sign in.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = () => {
    sessionStorage.removeItem(getStorageKey(requiredRole));
    setUser(null);
    setError("");
  };

  if (checking) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="flex items-center gap-2.5 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span>Verifying portal session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-2">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight pt-1">
              {portalTitle}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              {portalSubtitle}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 flex items-start gap-2"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="portal-email"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Institutional Email
              </label>
              <input
                id="portal-email"
                type="email"
                required
                autoComplete="username"
                placeholder={`${requiredRole}@lincoln.edu.my`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0b1120] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="portal-password"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="portal-password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0b1120] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                `Sign In as ${requiredRole === "admin" ? "Administrator" : "Teacher"}`
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Student Dashboard
            </Link>
            <span className="font-mono uppercase text-slate-500">
              RBAC: {requiredRole}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-[#0b1120] border-b border-slate-800/80 px-4 sm:px-6 lg:px-10 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="text-slate-400">
            Authenticated as{" "}
            <span className="text-slate-200 font-semibold">{user.full_name}</span>{" "}
            <span className="font-mono text-[11px] text-blue-400 uppercase ml-1">
              ({user.role})
            </span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
