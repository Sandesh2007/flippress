"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import type { User } from "@/model/user";
import { createBrowserClient } from "@/lib/database";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

// ============================================
// Types
// ============================================

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  signOut: () => Promise<void>;
}

interface CachedUserData {
  user: User;
  timestamp: number;
}

// ============================================
// Constants
// ============================================

const USER_CACHE_KEY = "flippress_user";
const USER_CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const PROFILE_FIELDS = "username, avatar_url, bio, location" as const;

// ============================================
// Cache Utilities
// ============================================

const userCache = {
  get(): User | null {
    if (typeof window === "undefined") return null;

    try {
      const cached = localStorage.getItem(USER_CACHE_KEY);
      if (!cached) return null;

      const { user, timestamp }: CachedUserData = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > USER_CACHE_EXPIRY_MS;

      if (!user || isExpired) {
        this.clear();
        return null;
      }

      return user;
    } catch {
      this.clear();
      return null;
    }
  },

  set(user: User | null): void {
    if (typeof window === "undefined") return;

    if (user) {
      const data: CachedUserData = { user, timestamp: Date.now() };
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data));
    } else {
      this.clear();
    }
  },

  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(USER_CACHE_KEY);
  },
};

// ============================================
// Utility Functions
// ============================================

function cleanUsername(username: unknown): string | null {
  if (typeof username !== "string" || !username) return null;
  return username.replace(/\s+/g, "").toLowerCase();
}

function buildUser(
  supabaseUser: SupabaseUser,
  profile?: Record<string, unknown> | null
): User {
  const { id, email, user_metadata, created_at } = supabaseUser;

  return {
    id,
    email: email ?? "",
    username: cleanUsername(profile?.username ?? user_metadata?.username) ?? "USERNAME",
    avatar_url: (profile?.avatar_url ?? user_metadata?.avatar_url) as string | undefined,
    bio: (profile?.bio ?? user_metadata?.bio) as string | undefined,
    location: (profile?.location ?? user_metadata?.location) as string | undefined,
    created_at,
  };
}

export function isValidUsername(username: unknown): username is string {
  return (
    typeof username === "string" &&
    username.length > 0 &&
    username === username.toLowerCase() &&
    /^[a-z0-9_]+$/.test(username)
  );
}

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => userCache.get());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const supabase = useMemo(() => createBrowserClient(), []);

  // Fetch profile from database
  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_FIELDS)
        .eq("id", userId)
        .single();

      // PGRST116 = not found, which is fine for new users
      if (error && error.code !== "PGRST116") {
        console.error("Profile fetch error:", error);
        return null;
      }

      return data;
    },
    [supabase]
  );

  // Refresh user from server
  const refreshUser = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      if (error || !authUser) {
        setUser(null);
        userCache.clear();
        return;
      }

      const profile = await fetchProfile(authUser.id);
      const newUser = buildUser(authUser, profile);

      setUser(newUser);
      userCache.set(newUser);
    } catch (error) {
      console.error("Refresh user error:", error);
      toast.error("Failed to load profile");
      setUser(null);
      userCache.clear();
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchProfile]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      userCache.clear();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  }, [supabase, router]);

  // Handle session changes
  const handleSession = useCallback(
    async (session: Session | null) => {
      if (!session?.user) {
        setUser(null);
        userCache.clear();
        setLoading(false);
        return;
      }

      try {
        const profile = await fetchProfile(session.user.id);
        const newUser = buildUser(session.user, profile);

        setUser(newUser);
        userCache.set(newUser);
      } catch (error) {
        console.error("Session handler error:", error);
      } finally {
        setLoading(false);
      }
    },
    [fetchProfile]
  );

  // Initialize & subscribe to auth changes
  useEffect(() => {
    refreshUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase, refreshUser, handleSession]);

  // Multi-tab sync
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === USER_CACHE_KEY) {
        setUser(userCache.get());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Sync cache on user change
  useEffect(() => {
    userCache.set(user);
  }, [user]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      refreshUser,
      setUser,
      signOut,
    }),
    [user, loading, refreshUser, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// Hooks
// ============================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Returns the current user's avatar URL with fallback support
 */
export function useUserAvatar(fallback: string | null = null): string | null {
  const { user } = useAuth();
  return user?.avatar_url ?? fallback;
}

/**
 * Redirects to set-username page if user hasn't set a valid username
 */
export function useRequireUsername(redirectPath = "/set-username") {
  const { user, loading } = useAuth();
  const router = useRouter();

  const needsUsername = !loading && user && !isValidUsername(user.username);

  useEffect(() => {
    if (needsUsername && window.location.pathname !== redirectPath) {
      router.replace(redirectPath);
    }
  }, [needsUsername, router, redirectPath]);

  return { needsUsername, loading };
}

/**
 * Redirects to login if user is not authenticated
 */
export function useRequireAuth(redirectPath = "/login") {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(redirectPath);
    }
  }, [loading, isAuthenticated, router, redirectPath]);

  return { user, loading, isAuthenticated };
}