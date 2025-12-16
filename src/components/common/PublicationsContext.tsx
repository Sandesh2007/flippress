'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { useAuth } from '@/components';

export interface Publication {
  id: string;
  title: string;
  description: string;
  pdf_url: string;
  thumb_url: string | null;
  created_at: string;
  user_id: string;
}

export interface PublicationsContextType {
  publications: Publication[];
  loading: boolean;
  error: string | null;
  refreshPublications: () => Promise<void>;
  addPublication: (publication: Publication) => void;
  updatePublication: (id: string, updates: Partial<Publication>) => void;
  deletePublication: (id: string) => void;
  getPublicationById: (id: string) => Publication | undefined;
  getUserPublications: (userId: string) => Publication[];
  getAllPublications: () => Promise<Publication[]>;
}

const PublicationsContext = createContext<PublicationsContextType | undefined>(undefined);

// Simple in-memory cache
class PublicationsCache {
  private cache = new Map<string, { data: Publication[]; timestamp: number }>();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  get(key: string): Publication[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: Publication[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  update(key: string, updater: (data: Publication[]) => Publication[]): void {
    const cached = this.cache.get(key);
    if (cached) {
      this.cache.set(key, {
        data: updater(cached.data),
        timestamp: Date.now()
      });
    }
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

const publicationsCache = new PublicationsCache();

export const PublicationsProvider = ({ children }: { children: ReactNode }) => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const mountedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserIdRef = useRef<string | null>(null);

  const getCacheKey = useCallback((userId: string) => `publications_${userId}`, []);

  const fetchPublications = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setPublications([]);
      setLoading(false);
      setError(null);
      return;
    }

    const cacheKey = getCacheKey(user.id);

    // Return cached data if available and not forcing refresh
    if (!forceRefresh) {
      const cached = publicationsCache.get(cacheKey);
      if (cached) {
        setPublications(cached);
        setLoading(false);
        setError(null);
        return;
      }
    }

    // Cancel previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('publications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .abortSignal(signal);

      // Check if request was aborted or component unmounted
      if (signal.aborted || !mountedRef.current) return;

      if (fetchError) throw fetchError;

      const publicationsData = data || [];
      setPublications(publicationsData);
      publicationsCache.set(cacheKey, publicationsData);
      setError(null);
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') return;
      if (!mountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch publications';
      console.error('Error fetching publications:', err);
      setError(errorMessage);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, getCacheKey]);

  // Initialize on mount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  // Fetch when user changes
  useEffect(() => {
    const userChanged = lastUserIdRef.current !== user?.id;
    lastUserIdRef.current = user?.id || null;

    if (user?.id) {
      fetchPublications(userChanged);
    } else {
      setPublications([]);
      setLoading(false);
      setError(null);
    }
  }, [user?.id, fetchPublications]);

  const refreshPublications = useCallback(async () => {
    await fetchPublications(true);
  }, [fetchPublications]);

  const addPublication = useCallback((publication: Publication) => {
    setPublications(prev => [publication, ...prev]);

    if (user?.id) {
      const cacheKey = getCacheKey(user.id);
      publicationsCache.update(cacheKey, prev => [publication, ...prev]);
    }
  }, [user?.id, getCacheKey]);

  const updatePublication = useCallback((id: string, updates: Partial<Publication>) => {
    setPublications(prev =>
      prev.map(pub => pub.id === id ? { ...pub, ...updates } : pub)
    );

    if (user?.id) {
      const cacheKey = getCacheKey(user.id);
      publicationsCache.update(cacheKey, prev =>
        prev.map(pub => pub.id === id ? { ...pub, ...updates } : pub)
      );
    }
  }, [user?.id, getCacheKey]);

  const deletePublication = useCallback((id: string) => {
    setPublications(prev => prev.filter(pub => pub.id !== id));

    if (user?.id) {
      const cacheKey = getCacheKey(user.id);
      publicationsCache.update(cacheKey, prev => prev.filter(pub => pub.id !== id));
    }
  }, [user?.id, getCacheKey]);

  const getPublicationById = useCallback((id: string) => {
    return publications.find(pub => pub.id === id);
  }, [publications]);

  const getUserPublications = useCallback((userId: string) => {
    return publications.filter(pub => pub.user_id === userId);
  }, [publications]);

  const getAllPublications = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching all publications:', err);
      return [];
    }
  }, []);

  const value: PublicationsContextType = {
    publications,
    loading,
    error,
    refreshPublications,
    addPublication,
    updatePublication,
    deletePublication,
    getPublicationById,
    getUserPublications,
    getAllPublications,
  };

  return (
    <PublicationsContext.Provider value={value}>
      {children}
    </PublicationsContext.Provider>
  );
};

export const usePublications = () => {
  const context = useContext(PublicationsContext);
  if (context === undefined) {
    throw new Error('usePublications must be used within a PublicationsProvider');
  }
  return context;
};
