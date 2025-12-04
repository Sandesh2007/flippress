'use client'

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import DFlipViewer from "@/components/DearFlipViewer";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileText, ArrowLeft, Loader2, Share2, Calendar, User, ExternalLink } from "lucide-react";
import { useRouter } from 'next/navigation';
import toast from "react-hot-toast";
import { createClient } from '@/lib/database/supabase/client';

export default function View() {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewerHeight, setViewerHeight] = useState('600px');
    const [isMounted, setIsMounted] = useState(false);
    const [publication, setPublication] = useState<{
        id: string;
        title: string;
        description?: string;
        pdf_url: string;
        thumb_url: string | null;
        created_at: string;
        user_id: string;
        author?: {
            username: string,
            avatar_url: string
        } | null;
    } | null>(null);

    const [isMobile, setIsMobile] = useState(false);

    const searchParams = useSearchParams();
    const router = useRouter();

    const publicationId = searchParams?.get('id');

    // Set mounted state
    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    const calculateViewerHeight = useCallback(() => {
        if (typeof window !== 'undefined') {
            const headerHeight = 80;
            const paddingAndMargin = 120;
            const availableHeight = window.innerHeight - headerHeight - paddingAndMargin;
            setViewerHeight(`${Math.max(500, availableHeight)}px`);
        }
    }, []);

    const checkMobileView = useCallback(() => {
        const newIsMobile = window.innerWidth <= 768;
        setIsMobile(prev => {
            if (prev !== newIsMobile) {
                return newIsMobile;
            }
            return prev;
        });
    }, []);

    useEffect(() => {
        calculateViewerHeight();
        checkMobileView();

        let resizeTimeout: NodeJS.Timeout;
        const handleResize = () => {
            calculateViewerHeight();
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                checkMobileView();
            }, 250);
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('resize', handleResize);
            return () => {
                window.removeEventListener('resize', handleResize);
                clearTimeout(resizeTimeout);
            };
        }
    }, [calculateViewerHeight, checkMobileView]);

    const fetchPublication = useCallback(async () => {
        if (!publicationId || !isMounted) return;

        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { data: publicationData, error: fetchError } = await supabase
                .from('publications')
                .select('*')
                .eq('id', publicationId)
                .single();

            if (fetchError || !publicationData) {
                throw new Error(fetchError?.message || 'Publication not found');
            }

            const { data: profileData } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', publicationData.user_id)
                .single();

            setPublication({
                ...publicationData,
                author: profileData || null
            });

            const response = await fetch(publicationData.pdf_url);
            if (!response.ok) {
                throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            if (blob.type !== 'application/pdf') {
                throw new Error('The provided URL does not point to a valid PDF file');
            }

            const filename = publicationData.title ? `${publicationData.title}.pdf` : 'document.pdf';
            const file = new File([blob], filename, { type: 'application/pdf' });
            setPdfFile(file);
            setError(null);
        } catch (err) {
            console.error("Error loading publication:", err);
            setError(err instanceof Error ? err.message : 'Failed to load publication');
        } finally {
            if (isMounted) {
                setIsLoading(false);
            }
        }
    }, [isMounted, publicationId]);

    useEffect(() => {
        if (isMounted && publicationId) {
            fetchPublication();
        } else if (isMounted && !publicationId) {
            setError('No publication ID provided');
            setIsLoading(false);
        }
    }, [fetchPublication, isMounted, publicationId]);

    // Set page title when publication loads
    useEffect(() => {
        if (publication?.title) {
            document.title = `${publication.title} - FlipPress`;
        }
        return () => {
            document.title = 'FlipPress';
        };
    }, [publication?.title]);

    const handleGoBack = useCallback(() => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push('/');
        }
    }, [router]);

    const handleShare = useCallback(async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied to clipboard!");
            } else {
                toast.error("Clipboard not available");
            }
        } catch (err) {
            console.error("Failed to copy:", err);
            toast.error("Failed to copy link");
        }
    }, []);

    const handleAuthorClick = useCallback(() => {
        if (publication?.author?.username) {
            router.push(`/profile/${encodeURIComponent(publication.author.username)}`);
        }
    }, [publication?.author?.username, router]);

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20 flex items-center justify-center p-6">
                <div className="glass rounded-3xl p-12 max-w-2xl w-full text-center shadow-xl">
                    <div className="bg-destructive/10 p-6 rounded-full mb-6 inline-flex">
                        <AlertCircle className="w-16 h-16 text-destructive" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-4">Unable to Load Publication</h2>
                    <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-md mx-auto">
                        {error || 'An error occurred while loading the publication. Please try again.'}
                    </p>
                    <Button 
                        variant="outline" 
                        size="lg"
                        onClick={handleGoBack} 
                        className="cursor-pointer text-base px-8"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20 flex flex-col items-center justify-center p-6">
                <div className="glass rounded-3xl p-12 text-center shadow-xl max-w-md">
                    <Loader2 className="w-16 h-16 text-primary animate-spin mb-6 mx-auto" />
                    <p className="text-2xl font-semibold text-foreground mb-3">Loading Publication</p>
                    <p className="text-base text-muted-foreground">Please wait while we fetch your document</p>
                </div>
            </div>
        );
    }

    if (!pdfFile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20 flex items-center justify-center p-6">
                <div className="glass rounded-3xl p-12 text-center shadow-xl max-w-md">
                    <FileText className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                    <h2 className="text-2xl font-semibold text-foreground mb-4">No Publication Found</h2>
                    <p className="text-muted-foreground mb-6">The requested publication could not be loaded.</p>
                    <Button onClick={handleGoBack} variant="outline" size="lg" className="cursor-pointer">
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20">
            {/* Enhanced Header */}
            <header className="sticky top-0 z-50 glass border-b border-border/50 backdrop-blur-xl shadow-sm">
                <div className="container mx-auto px-6 py-5 max-w-[2000px]">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Button 
                                variant="outline" 
                                size="lg"
                                onClick={handleGoBack}
                                className="cursor-pointer hover:scale-105 transition-transform"
                            >
                                <ArrowLeft className="h-5 w-5 mr-2" />
                                Back
                            </Button>
                            
                            <div className="hidden sm:flex items-center gap-3 min-w-0">
                                <div className="bg-primary/10 p-2 rounded-lg">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-xl font-bold truncate text-foreground">
                                        {publication?.title || pdfFile.name}
                                    </h1>
                                    {publication?.author && (
                                        <p className="text-sm text-muted-foreground">
                                            by {publication.author.username}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="w-full px-6 py-8">
                <div className="grid lg:grid-cols-10 gap-8 max-w-[2000px] mx-auto">
                    {/* PDF Viewer - 70% */}
                    <section className="lg:col-span-7 order-2 lg:order-1">
                        <div className="glass rounded-2xl overflow-hidden shadow-2xl border-2 border-border/50 bg-neutral-100 dark:bg-neutral-900">
                            <DFlipViewer
                                key={pdfFile.name}
                                pdfFile={pdfFile}
                                options={{
                                    webgl: true,
                                    autoEnableOutline: true,
                                    pageMode: isMobile ? 1 : 2,
                                    singlePageMode: isMobile ? 1 : 0,
                                    responsive: true,
                                    height: viewerHeight,
                                    duration: 800,
                                    backgroundColor: 'transparent',
                                    showDownloadControl: false,
                                    showPrintControl: false,
                                }}
                            />
                        </div>
                    </section>

                    {/* Publication Details Sidebar - 30% */}
                    <aside className="lg:col-span-3 space-y-6 order-1 lg:order-2">
                        {/* Author Card */}
                        {publication?.author && (
                            <div className="glass rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50">
                                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                                    Author
                                </h2>
                                <div
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-primary/5 cursor-pointer transition-all duration-200 group"
                                    onClick={handleAuthorClick}
                                >
                                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                                        {publication.author.avatar_url ? (
                                            <img
                                                src={publication.author.avatar_url}
                                                alt={publication.author.username}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-primary font-bold text-xl">
                                                {publication.author.username[0].toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                            {publication.author.username}
                                        </p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            View Profile
                                        </p>
                                    </div>
                                    <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </div>
                        )}

                        {/* Publication Info Card */}
                        <div className="glass rounded-2xl p-6 shadow-lg border border-border/50 space-y-6">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Publication Details
                            </h2>
                            
                            {/* Title */}
                            {publication?.title && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <FileText className="h-4 w-4" />
                                        <span className="text-xs uppercase tracking-wider font-medium">Title</span>
                                    </div>
                                    <p className="text-lg font-semibold text-foreground leading-snug">
                                        {publication.title}
                                    </p>
                                </div>
                            )}

                            <div className="border-t border-border/50" />

                            {/* Description */}
                            {publication?.description && (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <FileText className="h-4 w-4" />
                                            <span className="text-xs uppercase tracking-wider font-medium">Description</span>
                                        </div>
                                        <p className="text-base text-foreground/90 leading-relaxed">
                                            {publication.description}
                                        </p>
                                    </div>
                                    <div className="border-t border-border/50" />
                                </>
                            )}

                            {/* Published Date */}
                            {publication?.created_at && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span className="text-xs uppercase tracking-wider font-medium">Published</span>
                                    </div>
                                    <p className="text-base font-medium text-foreground">
                                        {new Date(publication.created_at).toLocaleDateString(undefined, {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions Card */}
                        <div className="glass rounded-2xl p-6 shadow-lg border border-border/50 space-y-4">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Actions
                            </h2>
                            
                            <div className="space-y-3">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={handleShare}
                                    className="w-full cursor-pointer hover:scale-[1.02] transition-all group"
                                >
                                    <Share2 className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                                    Share Publication
                                </Button>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
