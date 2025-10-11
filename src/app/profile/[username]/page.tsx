"use client"
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/database/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import LikeButton from '@/components/likes-button';
import { MapPin, BookOpen, Calendar, Share2, ExternalLink } from 'lucide-react';
import logo from '../../../../public/logo.svg';

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
}

interface Publication {
  id: string;
  title: string;
  description: string;
  pdf_url: string;
  thumb_url: string | null;
  created_at: string;
}

export default function PublicProfileByUsernamePage() {
  const params = useParams();
  const username = decodeURIComponent(params?.username as string);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const profileUrl = typeof window !== 'undefined' ? `flippress.vercel.app/profile/${encodeURIComponent(username)}` : '';
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setNotFound(false);
      const supabase = createClient();
      // Fetch user profile info by username always lowercase
      const { data: userData } = await supabase.from('profiles').select('*').eq('username', username).single();
      if (!userData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(userData);
      // Fetch publications
      const { data: pubs } = await supabase.from('publications').select('*').eq('user_id', userData.id).order('created_at', { ascending: false });
      setPublications(pubs || []);
      setLoading(false);
    };
    if (username) fetchData();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size='lg' text='Loading profile...' />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-4">User not found</h1>
          <p className="text-muted-foreground mb-6">The profile you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="outline">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {profile && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                {/* Avatar */}
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-border/50 group-hover:border-primary/50 transition-all duration-300 shadow-xl">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt="Avatar"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-muted/70 flex items-center justify-center">
                        <span className="text-4xl font-bold text-muted-foreground">
                          {profile.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                      {profile.username || 'User'}
                    </h1>
                    {profile.bio && (
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {profile.bio}
                      </p>
                    )}
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                    {profile.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{publications.length} Publication{publications.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {new Date().getFullYear()}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(profileUrl);
                      toast.success('Profile link copied to clipboard!');
                    }}
                    className="transition-all duration-200 hover:scale-105 group"
                  >
                    <Share2 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                    Share Profile
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Publications Section */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Publications</h2>
          <p className="text-muted-foreground">
            {publications.length === 0
              ? "No publications shared yet"
              : `${publications.length} publication${publications.length !== 1 ? 's' : ''} shared`
            }
          </p>
        </div>

        {publications.length === 0 ? (
          <div className="text-center py-20 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <img
                src={logo.src}
                draggable="false"
                alt="logo"
                className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No publications yet</h3>
            <p className="text-muted-foreground">
              {profile?.username} hasn't shared any publications.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {publications.map((pub, index) => (
              <Card
                key={pub.id}
                className="group overflow-hidden glass transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-border/50 hover:border-border animate-in fade-in-0 slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-2">
                  <div className="flex flex-col sm:flex-row h-full">
                    {/* Thumbnail */}
                    <div className="w-full rounded-md sm:w-48 h-48 sm:h-auto flex-shrink-0 relative overflow-hidden">
                      {pub.thumb_url ? (
                        <Image
                          src={pub.thumb_url}
                          alt="Thumbnail"
                          width={192}
                          height={192}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center border-2 rounded-md text-muted-foreground">
                          <div className="text-center">
                            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <span className="text-sm">No Preview</span>
                          </div>
                        </div>
                      )}

                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-semibold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                              {pub.title}
                            </h3>
                            <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                              {pub.description}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <LikeButton publicationId={pub.id} />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(pub.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</span>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = `/view?pdf=${encodeURIComponent(pub.pdf_url)}&title=${encodeURIComponent(pub.title)}`}
                            className='transition-all duration-200 hover:scale-105 group/btn'
                          >
                            <ExternalLink className="w-4 h-4 mr-2 group-hover/btn:rotate-12 transition-transform duration-200" />
                            View Publication
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
