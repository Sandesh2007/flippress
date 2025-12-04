'use client'
import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Users, BookOpen, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/database/supabase/client';
import { useAuth } from '@/components/auth/auth-context';
import LikeButton from './likesButton';

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  publications: Publication[];
}

interface DatabaseUserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface Publication {
  id: string;
  user_id: string;
  title: string;
  thumb_url: string | null;
  created_at: string;
  pdf_url: string;
}

interface OtherUsersPublicationsProps {
  title?: string;
  description?: string;
  maxUsers?: number;
  maxPublicationsPerUser?: number;
  showUserInfo?: boolean;
  className?: string;
}

// Cache for discover data
const discoverCache = new Map<string, { data: UserProfile[]; timestamp: number }>();
const DISCOVER_CACHE_DURATION = 10 * 60 * 1000; // 3 minutes

export default function OtherUsersPublications({
  title = "Community Publications",
  description = "Discover publications from other users",
  maxUsers = 10,
  maxPublicationsPerUser = 6,
  showUserInfo = true,
  className = ""
}: OtherUsersPublicationsProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const isMountedRef = useRef(true);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
    };
  }, []);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current) return;

    // Skip loading if we're navigating and have cached data
    if (!forceRefresh && shouldSkipLoading()) {
      const cacheKey = `discover_${maxUsers}_${maxPublicationsPerUser}`;
      const cached = discoverCache.get(cacheKey);
      if (cached && isMountedRef.current) {
        setUsers(cached.data);
        setLoading(false);
        setError(null);
        return;
      }
    }

    // Check cache first 
    const cacheKey = `discover_${maxUsers}_${maxPublicationsPerUser}`;
    const cached = discoverCache.get(cacheKey);
    const now = Date.now();
    const cacheAge = now - (cached?.timestamp || 0);

    // Use shorter cache duration for better data freshness
    if (!forceRefresh && cached && cacheAge < DISCOVER_CACHE_DURATION) {
      if (isMountedRef.current) {
        setUsers(cached.data);
        setLoading(false);
        setError(null);
      }
      return;
    }

    // If cache is stale, show loading but use cached data temporarily
    if (cached && cacheAge < DISCOVER_CACHE_DURATION * 2) {
      if (isMountedRef.current) {
        setUsers(cached.data);
      }
    }

    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }

    fetchControllerRef.current = new AbortController();
    const signal = fetchControllerRef.current.signal;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      if (!isMountedRef.current || signal.aborted) return;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id,username,avatar_url')
        .limit(maxUsers);

      if (profilesError) throw profilesError;
      if (!isMountedRef.current || signal.aborted) return;

      if (!profiles) {
        if (isMountedRef.current) {
          setUsers([]);
          setLoading(false);
        }
        return;
      }

      const { data: allPubs, error: pubsError } = await supabase
        .from('publications')
        .select('*')
        .order('created_at', { ascending: false });

      if (pubsError) throw pubsError;
      if (!isMountedRef.current || signal.aborted) return;

      // Group publications by user
      const pubsByUser: Record<string, Publication[]> = {};
      allPubs?.forEach((pub: Publication) => {
        if (!pubsByUser[pub.user_id]) pubsByUser[pub.user_id] = [];
        if (pubsByUser[pub.user_id].length < maxPublicationsPerUser) {
          pubsByUser[pub.user_id].push(pub);
        }
      });

      // Attach publications to users
      const usersWithPubs = profiles
        .map((userProfile: DatabaseUserProfile) => ({
          ...userProfile,
          publications: pubsByUser[userProfile.id] || [],
        }))
        .filter(userProfile => userProfile.publications.length > 0);

      if (!isMountedRef.current || signal.aborted) return;

      // Update cache
      discoverCache.set(cacheKey, { data: usersWithPubs, timestamp: now });

      if (isMountedRef.current) {
        setUsers(usersWithPubs);
        setLoading(false);
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || !isMountedRef.current) {
        return;
      }

      console.error('Error fetching data:', err);
      if (isMountedRef.current) {
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    }
  }, [maxUsers, maxPublicationsPerUser]);

  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      fetchData();
    }
  }, [fetchData]);

  const handleRetry = useCallback(() => {
    fetchData(true); // Force refresh
  }, [fetchData]);

  return (
    <div className={`${className}`}>
      {/* Header */}
      {(title || description) && (
        <div className="mb-8 text-center">
          {title && (
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-muted/50 rounded-xl shadow-soft">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">{title}</h2>
            </div>
          )}
          {description && <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{description}</p>}
        </div>
      )}

      {loading ? (
        <div className="space-y-12">
          {Array.from({ length: 3 }).map((_, userIndex) => (
            <div key={userIndex} className="space-y-6">
              {/* User Header Skeleton */}
              <div className="flex items-center gap-4 p-6 glass rounded-xl border border-border/30 shadow-soft">
                <Skeleton className="w-12 h-12 rounded-full bg-neutral-500" />
                <div className="space-y-2">
                  <Skeleton className="w-32 h-5 bg-neutral-500" />
                  <Skeleton className="w-24 h-4 bg-neutral-500" />
                </div>
              </div>
              {/* Publications Grid Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pl-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse glass border-border/30">
                    <CardContent className="p-4">
                      <Skeleton className="w-full h-40 rounded mb-3 bg-neutral-500" />
                      <Skeleton className="h-4 rounded mb-2 bg-neutral-500" />
                      <Skeleton className="h-3 rounded w-2/3 bg-neutral-500" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4 shadow-soft">
            <RefreshCw className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-destructive">{error}</h3>
          <Button onClick={handleRetry} className="transition-all duration-200 hover:scale-105 bg-foreground text-background hover:bg-foreground/90">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-soft">
            <BookOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-foreground">No publications found</h3>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            Be the first to share your work with the community!
          </p>
          {user && (
            <Button asChild className="transition-all duration-200 hover:scale-105 bg-foreground text-background hover:bg-foreground/90">
              <Link href="/home/create">Upload Your First Publication</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {users.map((userProfile, userIndex) => (
            <div
              key={userProfile.id}
              className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${userIndex * 200}ms` }}
            >
              {/* User Header */}
              {showUserInfo && (
                <div className="group mb-6">
                  <Link
                    href={`/profile/${userProfile.username}`}
                    className="flex items-center gap-4 p-6 glass outline-1 rounded-xl hover:border-border/60 transition-all duration-300 hover:shadow-soft hover:scale-[1.01]"
                  >
                    <div className="relative">
                      {userProfile.avatar_url ? (
                        <Image
                          src={userProfile.avatar_url}
                          alt={`${userProfile.username}'s avatar`}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover border-2 border-border group-hover:border-foreground/30 transition-all duration-300 shadow-soft"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const nextEl = e.currentTarget.nextElementSibling as HTMLElement;
                            if (nextEl) nextEl.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-12 h-12 rounded-full bg-muted border-2 border-border group-hover:border-foreground/30 flex items-center justify-center transition-all duration-300 shadow-soft ${userProfile.avatar_url ? 'hidden' : ''}`}>
                        <span className="text-muted-foreground font-semibold">
                          {userProfile.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-foreground group-hover:text-foreground transition-colors duration-300">
                        {userProfile.username}
                      </h3>
                      <p className="text-muted-foreground flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        {userProfile.publications.length} publication{userProfile.publications.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <ChevronRight className='text-muted-foreground' />
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Publications Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {userProfile.publications.map((pub: Publication, pubIndex) => (
                  <div
                    key={pub.id}
                    className="group animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                    style={{ animationDelay: `${(userIndex * 200) + (pubIndex * 100)}ms` }}
                  >
                    <Card className="h-full glass overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/40 hover:border-border/60">
                      <CardContent className="p-0 relative">
                        <div
                          onClick={() => {
                            window.location.href = `/view?id=${encodeURIComponent(pub.id)}`
                          }}
                          className="block cursor-pointer"
                        >
                          {/* Image Container */}
                          <div className="relative aspect-[4/5] overflow-hidden bg-muted/30">
                            {pub.thumb_url ? (
                              <Image
                                src={pub.thumb_url}
                                alt={pub.title}
                                width={400}
                                height={500}
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                  <span className="text-sm text-muted-foreground font-medium">No Preview</span>
                                </div>
                              </div>
                            )}

                            {/* Gradient Overlay on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>

                          {/* Content Section */}
                          <div className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="font-semibold text-foreground line-clamp-2 text-base leading-snug group-hover:text-primary transition-colors duration-300 flex-1">
                                {pub.title}
                              </h4>
                              <div className='outline-1 rounded-full' onClick={(e) => e.stopPropagation()}>
                                <LikeButton publicationId={pub.id} showText={false} />
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <p className="text-xs text-muted-foreground font-medium">
                                {new Date(pub.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                              <div className="flex items-center gap-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
