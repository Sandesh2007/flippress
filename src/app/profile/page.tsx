'use client'
import EditProfile from "@/components/forms/edit-profile";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin, Heart, Pencil, Save, X, Grid3X3, List,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";
import { useEffect, useState, useRef, useMemo } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { AlertDialog, Input, NoPublications, usePublications } from "@/components";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { User, BookOpen } from 'lucide-react';
import { shouldSkipLoading } from '@/components/layout/navigation-state-manager';
import { GradientBackground } from "@/components/ui/gradient-background";

interface LikeRow {
  publication_id: string;
  user_id: string;
}

// Cache for likes data
const likesCache = new Map<string, { data: Record<string, number>; timestamp: number }>();
const LIKES_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export default function UserProfile() {
  const { user, loading: authLoading } = useAuth();
  const { publications, loading: publicationsLoading, updatePublication, refreshPublications } = usePublications();
  const supabase = createClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editThumb, setEditThumb] = useState<File | null>(null);
  const [editThumbUrl, setEditThumbUrl] = useState('');
  const editThumbInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [actionLoading, setActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [originalOrder, setOriginalOrder] = useState<string[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isMountedRef = useRef(true);
  const fetchControllerRef = useRef<AbortController | null>(null);

  // Save original publication order once
  useEffect(() => {
    if (publications.length > 0 && originalOrder.length === 0) {
      setOriginalOrder(publications.map((p) => p.id));
    }
  }, [publications, originalOrder.length]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const fetchLikes = async () => {
      if (!user || publications.length === 0) return;

      // Check cache first
      const cacheKey = `likes_${user.id}`;
      const cached = likesCache.get(cacheKey);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < LIKES_CACHE_DURATION) {
        setLikes(cached.data);
        return;
      }

      // Cancel any ongoing fetch
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }

      fetchControllerRef.current = new AbortController();
      const signal = fetchControllerRef.current.signal;

      setLikesLoading(true);
      const supabase = createClient();
      const pubIds = publications.map((p) => p.id);

      try {
        const { data: allLikes } = await supabase
          .from('publication_likes')
          .select('publication_id, user_id')
          .in('publication_id', pubIds);

        if (signal.aborted || !isMountedRef.current) return;

        const likeMap: Record<string, number> = {};
        allLikes?.forEach((row: LikeRow) => {
          likeMap[row.publication_id] = (likeMap[row.publication_id] || 0) + 1;
        });

        // Update cache
        likesCache.set(cacheKey, { data: likeMap, timestamp: now });

        if (isMountedRef.current) {
          setLikes(likeMap);
        }
      } catch (error) {
        console.error('Error fetching likes:', error);
      } finally {
        if (isMountedRef.current && !signal.aborted) {
          setLikesLoading(false);
        }
      }
    };

    fetchLikes();
  }, [user, publications]);

  const startEdit = (pub: any) => {
    setEditingId(pub.id);
    setEditTitle(pub.title);
    setEditDescription(pub.description);
    setEditThumbUrl(pub.thumb_url || '');
    setEditThumb(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
    setEditThumb(null);
    setEditThumbUrl('');
  };

  const handleEditSave = async (pub: any) => {
    setActionLoading(true);

    await toast.promise((async () => {
      let thumbUrl = editThumbUrl;

      if (editThumb) {
        if (pub.thumb_url) {
          const oldThumbPath = pub.thumb_url.split('/').pop();
          if (oldThumbPath) {
            await supabase.storage.from('publications').remove([`thumbs/${oldThumbPath}`]);
          }
        }

        const thumbPath = `thumbs/${Date.now()}_${editThumb.name}`;
        const { error: uploadError, data } = await supabase.storage
          .from('publications')
          .upload(thumbPath, editThumb);

        if (uploadError) {
          throw new Error(`Failed to upload thumbnail: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage.from('publications').getPublicUrl(thumbPath);
        thumbUrl = urlData.publicUrl;
      }

      if (!pub.id) throw new Error('Missing publication ID.');
      console.log('Updating pub with ID:', pub.id);

      const { error: updateError, data } = await supabase
        .from('publications')
        .update({
          title: editTitle,
          description: editDescription,
          thumb_url: thumbUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', pub.id)
        .select();

      if (data) {
        console.log(data);
      }

      if (updateError) {
        console.error(updateError);
        throw new Error(`Failed to update publication: ${updateError.message}`);
      }

      updatePublication(pub.id, {
        title: editTitle,
        description: editDescription,
        thumb_url: thumbUrl,
      });

      cancelEdit();
    })(), {
      loading: 'Saving changes...',
      success: 'Publication updated successfully!',
      error: (err) => err?.message || 'Failed to update publication',
    });

    setActionLoading(false);
  };

  const sortedPublications = useMemo(() => {
    let pubs = [...publications];

    if (editingId) {
      const editingPubIndex = pubs.findIndex(p => p.id === editingId);
      if (editingPubIndex > -1) {
        const [editingPub] = pubs.splice(editingPubIndex, 1);
        pubs.unshift(editingPub);
      }
    } else {
      pubs.sort((a, b) => {
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
        return bTime - aTime; // Newest first
      });
    }

    return pubs;
  }, [publications, editingId]);

  // Show loading only if auth is loading or if we don't have any data yet
  // Skip loading during navigation if we have cached data
  const isLoading = authLoading || (publicationsLoading && publications.length === 0 && !shouldSkipLoading());

  // Add a fallback loading state for when data is stale
  const [isDataStale, setIsDataStale] = useState(false);

  useEffect(() => {
    // Check if data is stale (more than 5 minutes old)
    if (publications.length > 0) {
      const now = Date.now();
      const lastUpdate = Date.now() - 5 * 60 * 1000; // 5 minutes ago
      setIsDataStale(false);
    }
  }, [publications]);

  // Force refresh if data seems stale
  useEffect(() => {
    if (isDataStale && !publicationsLoading) {
      refreshPublications();
    }
  }, [isDataStale, publicationsLoading, refreshPublications]);

  if (isLoading) {
    return (
      <GradientBackground className="min-h-screen  flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </GradientBackground>
    );
  }

  return (
    <>
      {user ? (
        <div className="min-h-screen relative overflow-hidden">
          <div className="relative">
            {/* Profile Header */}
            <div className="relative overflow-hidden">
              <div className="relative max-w-4xl mx-auto px-4 py-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-border/50 group-hover:border-primary/50 transition-all duration-300 shadow-xl">
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url}
                            alt={user.username ? user.username.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/70 flex items-center justify-center">
                            <span className="text-4xl font-bold text-muted-foreground">
                              {user.username ? user.username.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-glass border border-primary/20 mb-4">
                        <User className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Your Profile</span>
                      </div>
                      <h1 className="text-2xl sm:text-2xl font-bold mb-2 truncate">
                        {user.username || user.email}
                      </h1>
                      <p className="text-muted-foreground text-lg mb-3">{user.bio}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {user.location && (
                          <>
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{user.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className='flex gap-3 justify-between items-center w-full sm:w-auto'>
                    <EditProfile />
                    <Button
                      className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-glow"
                      onClick={() => {
                        setLogoutDialogOpen(true);
                      }}
                      variant="destructive">
                      <span>Logout</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmation dialog for logout */}
            <AlertDialog
              open={logoutDialogOpen}
              onOpenChange={setLogoutDialogOpen}
              title="Confirm Logout"
              description="Are you sure you want to log out? You will need to log in again to access your account."
              confirmText="Logout"
              cancelText="Cancel"
              onConfirm={async () => {
                setIsLoggingOut(true);
                try {
                  await toast.promise(supabase.auth.signOut(), {
                    loading: 'Logging out...',
                    success: 'Logged out successfully',
                    error: 'Failed to log out',
                  });
                  window.location.href = '/';
                } finally {
                  setIsLoggingOut(false);
                }
              }}
              onCancel={() => setLogoutDialogOpen(false)}
              variant="destructive"
              isLoading={isLoggingOut}
            />

            {/* Publications Section */}
            <div className="max-w-7xl mx-auto px-4 py-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-glass border border-primary/20 mb-4">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Your Publications</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gradient-hero mb-2">My Publications</h2>
                  <p className="text-muted-foreground text-lg">{sortedPublications.length} publication{sortedPublications.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2 bg-gradient-card outline-1 p-1 rounded-xl shadow-soft">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="transition-all duration-200 hover:scale-105 rounded-lg"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="transition-all duration-200 hover:scale-105 rounded-lg"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {publicationsLoading && publications.length === 0 && !shouldSkipLoading() ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="animate-pulse bg-gradient-card border border-border/50 rounded-2xl">
                      <CardContent className="p-4">
                        <div className="w-full h-32 bg-muted rounded-xl mb-3"></div>
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : sortedPublications.length === 0 ? (
                <NoPublications />
              ) : viewMode === 'grid' ? (
                // Grid View
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {sortedPublications.map((pub, index) => {
                    const likeCount = likes[pub.id] || 0;
                    return (
                      <div
                        key={pub.id}
                        className="group relative animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-glow hover:-translate-y-2 hover:scale-[1.02] border-border/50 hover:border-primary/30 glass rounded-2xl">
                          <CardContent className="p-2 flex flex-col h-full cursor-pointer">
                            {/* Image Container */}
                            <div className="relative overflow-hidden border-2 rounded-md">
                              {pub.thumb_url ? (
                                <Image
                                  src={pub.thumb_url}
                                  alt={pub.title}
                                  width={300}
                                  height={200}
                                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-48 flex items-center justify-center glass text-muted-foreground text-sm ${pub.thumb_url ? 'hidden' : ''}`}>
                                <div className="text-center">
                                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  No Preview
                                </div>
                              </div>

                              {/* Like Count Overlay */}
                              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-medium">
                                <Heart className="w-3 h-3 text-red-500" />
                                {likeCount}
                              </div>

                              {/* Action Buttons Overlay */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75 cursor-pointer rounded-xl"
                                  onClick={() => { setViewMode('list'); startEdit(pub); }}
                                >
                                  <Pencil className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            </div>

                            {/* Content */}
                            <div
                              onClick={() => router.push(`/view?id=${encodeURIComponent(pub.id)}`)}
                              className="p-4 flex-1 flex flex-col">
                              <h3 className="font-semibold text-foreground mb-2 line-clamp-2 text-sm leading-tight">
                                {pub.title}
                              </h3>
                              <p className="text-muted-foreground text-xs line-clamp-2 mb-3 flex-1">
                                {pub.description}
                              </p>
                              <div className="text-xs text-muted-foreground">
                                {new Date(pub.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // List View
                <div className="space-y-6">
                  {sortedPublications.map((pub, index) => (
                    <Card
                      key={pub.id}
                      className="group transition-all duration-300 hover:shadow-glow border-border/50 hover:border-primary/30 animate-in fade-in-0 slide-in-from-left-4 glass rounded-2xl"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardContent className="p-2">
                        {editingId === pub.id ? (
                          // Edit Mode
                          <div className="p-6">
                            <Input
                              type="file"
                              accept="image/*"
                              ref={editThumbInputRef}
                              className="hidden glass"
                              onChange={e => setEditThumb(e.target.files?.[0] || null)}
                            />
                            <div className="flex flex-col lg:flex-row gap-6">
                              {/* Image Upload Area */}
                              <div
                                className="w-full lg:w-32 h-48 lg:h-40 flex items-center justify-center glass outine-2 outline-dashed outline-primary/40 rounded-xl cursor-pointer hover:border-primary/50 transition-colors duration-200"
                                onClick={() => editThumbInputRef.current?.click()}
                              >
                                {editThumb ? (
                                  <Image
                                    src={URL.createObjectURL(editThumb)}
                                    alt="New Thumb"
                                    width={128}
                                    height={160}
                                    className="w-full h-full object-cover rounded-xl"
                                  />
                                ) : editThumbUrl ? (
                                  <Image
                                    src={editThumbUrl}
                                    alt="Thumb"
                                    width={128}
                                    height={160}
                                    className="w-full h-full object-cover rounded-xl"
                                  />
                                ) : (
                                  <div className="text-center text-muted-foreground">
                                    <BookOpen className="w-8 h-8 mx-auto mb-2" />
                                    <span className="text-sm">Click to upload</span>
                                  </div>
                                )}
                              </div>

                              {/* Edit Form */}
                              <div className="flex-1 space-y-4">
                                <input
                                  className="w-full text-lg font-semibold text-foreground glass border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                                  value={editTitle}
                                  onChange={e => setEditTitle(e.target.value)}
                                  placeholder="Publication title..."
                                />
                                <textarea
                                  className="w-full text-muted-foreground glass border border-border rounded-xl px-4 py-3 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                                  value={editDescription}
                                  onChange={e => setEditDescription(e.target.value)}
                                  placeholder="Description..."
                                />
                                <div className="text-xs text-muted-foreground">
                                  Created: {new Date(pub.created_at).toLocaleString()}
                                </div>
                                <div className="flex gap-3 pt-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleEditSave(pub)}
                                    disabled={actionLoading}
                                    className="transition-all duration-200 hover:scale-105 hover:shadow-glow rounded-xl"
                                  >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEdit}
                                    disabled={actionLoading}
                                    className="transition-all duration-200 hover:scale-105 rounded-xl"
                                  >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div className="flex flex-col lg:flex-row">
                            {/* Image */}
                            <div className="w-full lg:w-32 border-2 rounded-md h-48 lg:h-40 flex-shrink-0">
                              {pub.thumb_url ? (
                                <Image
                                  src={pub.thumb_url}
                                  alt="Thumbnail"
                                  width={128}
                                  height={160}
                                  className="w-full h-full object-cover rounded-md"
                                />
                              ) : (
                                <div className="w-full h-full glass flex items-center justify-center text-muted-foreground rounded-md">
                                  <div className="text-center">
                                    <BookOpen className="w-6 h-6 mx-auto mb-1 opacity-50" />
                                    <span className="text-xs">No Preview</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-6 flex flex-col justify-between">
                              <div className="flex-1">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-semibold text-foreground mb-2 line-clamp-2">
                                      {pub.title}
                                    </h3>
                                    <p className="text-muted-foreground mb-4 line-clamp-3">
                                      {pub.description}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Heart className="w-4 h-4 text-red-500" />
                                    <span className="font-medium">{likes[pub.id] || 0}</span>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="text-xs text-muted-foreground">
                                    Created {new Date(pub.created_at).toLocaleDateString()}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => router.push(`/view?id=${encodeURIComponent(pub.id)}`)}
                                      className='cursor-pointer transition-all duration-200 hover:scale-105 rounded-xl'
                                    >
                                      View Publication
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => startEdit(pub)}
                                      className="transition-all duration-200 hover:scale-105 cursor-pointer rounded-xl"
                                    >
                                      <Pencil className="w-4 h-4 mr-1" />
                                      Edit
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (

        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
          <LoadingSpinner />
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <div className="w-24 h-24 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-6">
                <User className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-4 text-gradient-hero">You are not logged in</h1>
              <p className="text-muted-foreground mb-8 text-lg">Please log in to view your profile.</p>
              <div className="flex gap-4 justify-center">
                <Link href="/auth/register?mode=login" className="text-primary hover:underline">
                  <Button variant="outline" className="cursor-pointer rounded-xl">Login</Button>
                </Link>
                <Link href="/auth/register?mode=register" className="text-primary hover:underline">
                  <Button className="bg-gradient-hero hover:shadow-glow rounded-xl">Register</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
      }
    </>
  );
}
