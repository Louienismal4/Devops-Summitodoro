"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase/client";

const clearSummitodoroBrowserData = () => {
  [window.localStorage, window.sessionStorage].forEach((storage) => {
    const keys = Array.from({ length: storage.length }, (_, index) =>
      storage.key(index),
    );
    keys.forEach((key) => {
      if (key?.startsWith("summitodoro:")) storage.removeItem(key);
    });
  });
};

type ProfileOnboardingDialogProps = {
  initialName: string;
  onComplete: (displayName: string, avatarUrl: string | null) => void;
  mode?: "onboarding" | "edit";
  onClose?: () => void;
};

export function ProfileOnboardingDialog({
  initialName,
  onComplete,
  mode = "onboarding",
  onClose,
}: ProfileOnboardingDialogProps) {
  const [displayName, setDisplayName] = useState(initialName);
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(() => supabase !== null);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    void (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        setLoadingUser(false);
        return;
      }

      if (window.location.hash) {
        window.history.replaceState(
          {},
          document.title,
          `${window.location.pathname}${window.location.search}`,
        );
      }

      setUser(data.user);
      const metadata = data.user.user_metadata;
      const googleName =
        typeof metadata.full_name === "string"
          ? metadata.full_name
          : typeof metadata.name === "string"
            ? metadata.name
            : initialName;
      const { data: savedProfile } = await supabase
        .from("hiker_profiles")
        .select("display_name")
        .eq("id", data.user.id)
        .maybeSingle();
      setDisplayName(savedProfile?.display_name ?? googleName);
      setLoadingUser(false);
    })();
  }, [initialName]);

  const signInWithGoogle = async () => {
    if (!supabase) return;
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin,
      },
    });
    if (error) setAuthError(error.message);
  };

  const saveProfile = async () => {
    if (!supabase || !user || !displayName.trim()) return;

    setSaving(true);
    setAuthError(null);
    const metadata = user.user_metadata;
    const avatarUrl =
      typeof metadata.avatar_url === "string"
        ? metadata.avatar_url
        : typeof metadata.picture === "string"
          ? metadata.picture
          : null;
    const { error } = await supabase.from("hiker_profiles").upsert(
      {
        id: user.id,
        display_name: displayName.trim(),
        avatar_url: avatarUrl,
      },
      { onConflict: "id" },
    );
    setSaving(false);

    if (error) {
      setAuthError(error.message);
      return;
    }
    onComplete(displayName, avatarUrl);
    onClose?.();
  };

  const signOut = async () => {
    if (!supabase) return;

    setLoggingOut(true);
    setAuthError(null);
    const { error } = await supabase.auth.signOut();
    setLoggingOut(false);

    if (error) {
      setAuthError(error.message);
      return;
    }

    clearSummitodoroBrowserData();
    window.location.replace("/hike");
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && mode === "edit") onClose?.();
      }}
    >
      <DialogContent
        className="profile-onboarding-dialog"
        overlayClassName="profile-onboarding-backdrop"
      >
        <span className="profile-onboarding-emblem" aria-hidden="true">
          🥾
        </span>
        <p className="section-kicker">
          {mode === "edit" ? "Hiker profile" : "Welcome to Summitodoro"}
        </p>
        <DialogTitle id="profile-onboarding-title">
          {mode === "edit"
            ? "Edit hiker profile"
            : user
              ? "Name your hiker"
              : "Continue your expedition"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {mode === "edit"
            ? "Update your Summitodoro hiker profile."
            : "Sign in and create your Summitodoro hiker profile."}
        </DialogDescription>
        {!user && (
          <p>Sign in with Google first, then choose the name for your hiker.</p>
        )}
        {user && (
          <>
            <p>Your hiker profile will be saved to your Supabase account.</p>
            <label>
              Hiker name
              <input
                value={displayName}
                maxLength={40}
                autoFocus
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="primary-button"
              disabled={!displayName.trim() || saving}
              onClick={() => void saveProfile()}
            >
              {saving
                ? "Saving profile…"
                : mode === "edit"
                  ? "Save changes"
                  : "Save hiker profile"}
            </button>
          </>
        )}
        {supabase && !user && !loadingUser ? (
          <button
            type="button"
            className="google-sign-in"
            onClick={() => void signInWithGoogle()}
          >
            Continue with Google
          </button>
        ) : (
          !supabase && (
            <p className="google-sign-in-note">
              Google sign-in is not configured yet.
            </p>
          )
        )}
        {authError && <p className="google-sign-in-note">{authError}</p>}
        {mode === "edit" && user && (
          <button
            type="button"
            className="profile-dialog-logout"
            disabled={loggingOut}
            onClick={() => void signOut()}
          >
            {loggingOut ? "Logging out…" : "Log out"}
          </button>
        )}
        <div className="profile-dialog-links">
          <Link href="/about">About Summitodoro</Link>
          <Link href="/changelog">Changelog</Link>
        </div>
        {mode === "edit" && onClose && (
          <button
            type="button"
            className="profile-dialog-close"
            onClick={onClose}
          >
            Close
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
