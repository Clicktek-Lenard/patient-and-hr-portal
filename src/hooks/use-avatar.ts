"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const AVATAR_STORAGE_KEY = (userId: string) => `nwd_avatar_${userId}`;

/**
 * Returns the current user's avatar data URL from localStorage,
 * and re-renders whenever it changes (via a storage event or
 * the custom "nwd-avatar-changed" event fired by the profile page).
 */
export function useAvatar(): string | null {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (typeof window === "undefined" || !userId) return null;
    return localStorage.getItem(AVATAR_STORAGE_KEY(userId));
  });

  useEffect(() => {
    if (!userId) return;

    // Read immediately when userId becomes available
    setAvatarUrl(localStorage.getItem(AVATAR_STORAGE_KEY(userId)));

    // Listen for changes made in the same tab via custom event
    function onAvatarChanged() {
      setAvatarUrl(localStorage.getItem(AVATAR_STORAGE_KEY(userId!)));
    }

    // Listen for changes made in other tabs via storage event
    function onStorage(e: StorageEvent) {
      if (e.key === AVATAR_STORAGE_KEY(userId!)) {
        setAvatarUrl(e.newValue);
      }
    }

    window.addEventListener("nwd-avatar-changed", onAvatarChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("nwd-avatar-changed", onAvatarChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, [userId]);

  return avatarUrl;
}
