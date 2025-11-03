'use client'

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import DFlipViewer from "@/components/DearFlipViewer";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileText, ArrowLeft, Loader2, Share2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import toast from "react-hot-toast";
import { createClient } from '@/lib/database/supabase/client';

export default function View() {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [viewerHeight, setViewerHeight] = useState('600px');
    const [isMounted, setIsMounted] = useState(true);
    const [somethingWentWrong, setSomethingWentWrong] = useState(false);
    const [forceRerender, setForceRerender] = useState(0);
    const [publication, setPublication] = useState<{
        id: string;
        title: string;
        pdf_url: string;
        thumb_url: string | null;
        created_at: string;
        user_id: string;
        author?: {
            username: string,
            avatar_url: string
        } | null;
    } | null>(null);

    // Add stable responsive values that only change on significant viewport changes
    const [isMobile, setIsMobile] = useState(false);

    const searchParams = useSearchParams();
    const router = useRouter();

    const publicationId = searchParams?.get('id');

    const calculateViewerHeight = useCallback(() => {
        if (typeof window !== 'undefined') {
            const headerHeight = 64;
            const paddingAndMargin = 96;
            const availableHeight = window.innerHeight - headerHeight - paddingAndMargin;
            setViewerHeight(`${Math.max(400, availableHeight)}px`);
        }
    }, []);

    // Separate function to check if mobile
    const checkMobileView = useCallback(() => {
        if (typeof window !== 'undefined') {
            const newIsMobile = window.innerWidth <= 768;
            setIsMobile(prev => {
                if (prev !== newIsMobile) {
                    return newIsMobile;
                }
                return prev;
            });
        }
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
            // First, get the publication
            const { data: publicationData, error: fetchError } = await supabase
                .from('publications')
                .select('*')
                .eq('id', publicationId)
                .single();

            if (fetchError || !publicationData) {
                throw new Error(fetchError?.message || 'Publication not found');
            }

            // Then, get the author's profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', publicationData.user_id)
                .single();

            setPublication({
                ...publicationData,
                author: profileData || null
            });

            // Now load the PDF file
            const response = await fetch(publicationData.pdf_url);
            if (!response.ok) {
                throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            if (blob.type !== 'application/pdf') {
                throw new Error('The provided URL does not point to a valid PDF file');
            }

            const filename = publicationData.title ? `${publicationData.title}.pdf` : 'document.pdf';

            // Create a File object from the blob
            const file = new File([blob], filename, { type: 'application/pdf' });
            setPdfFile(file);
            setError(null);
            setSomethingWentWrong(false);
        } catch (err) {
            console.error("Error loading publication:", err);
            setError(err instanceof Error ? err.message : 'Failed to load publication');
            setSomethingWentWrong(true);
        } finally {
            if (isMounted) {
                setIsLoading(false);
            }
        }
    }, [isMounted, publicationId, retryCount]);

    // Load publication when component mounts or when ID changes
    useEffect(() => {
        if (isMounted && publicationId) {
            fetchPublication();
        } else if (!publicationId) {
            setSomethingWentWrong(true);
            setIsLoading(false);
        }
    }, [fetchPublication, isMounted, publicationId]);

    const handleGoBack = useCallback(() => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push('/'); // Fallback to home page
        }
    }, [router]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSomethingWentWrong(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, [isLoading]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
                <div className="bg-destructive/10 p-4 rounded-full mb-4">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Publication</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                    {error || 'An error occurred while loading the publication. Please try again.'}
                </p>
                <Button variant="outline" onClick={handleGoBack} className="flex items-center gap-2 cursor-pointer">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-lg font-medium text-foreground">Loading publication...</p>
                <p className="text-sm text-muted-foreground mt-2">Please wait while we fetch your document</p>
            </div>
        );
    }

    if (!pdfFile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
                <div className="text-center space-y-4">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
                    <h2 className="text-xl font-semibold">No publication loaded</h2>
                    <Button onClick={handleGoBack} variant="outline" className="cursor-pointer">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    // Show PDF viewer
    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-10 glass border-b border-primary ">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2 p-2 truncate">
                        <Button variant="outline" size="lg" onClick={handleGoBack}>
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                        <FileText className="h-5 w-5 text-primary" />
                        <h1 className="text-lg font-semibold truncate">
                            {publication?.title || pdfFile.name}
                        </h1>

                        <div className="w-20" />
                    </div>
                </div>
            </header>

            {/* Body */}
            <main className="flex-1 container py-6 grid lg:grid-cols-12 gap-6">
                {/* Left: Publication details */}
                <aside className="lg:col-span-4 p-2">
                    <div className="glass outline rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                        <h2 className="text-lg font-semibold mb-4">Publication Details</h2>

                        <div className="space-y-5 text-sm">
                            {/* Author */}
                            {publication?.author && (
                                <div
                                    className="flex items-center gap-3 hover:bg-primary/10 p-2 rounded-md cursor-pointer transition-colors"
                                    onClick={() => router.push(`/profile/${publication.author?.username}`)}
                                >
                                    {/* Avatar */}
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                        {publication.author.avatar_url ? (
                                            <img
                                                src={publication.author.avatar_url}
                                                alt={publication.author.username}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-primary font-semibold">
                                                {publication.author.username[0].toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Author Info */}
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                            Author
                                        </p>
                                        <p className="text-base font-medium text-foreground">
                                            {publication.author.username}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Divider */}
                            <div className="border-t border-border/60" />

                            {/* Title */}
                            {publication?.title && (
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Title
                                    </p>
                                    <p className="text-base font-medium text-foreground">
                                        {publication.title}
                                    </p>
                                </div>
                            )}

                            {/* Divider */}
                            <div className="border-t border-border/60" />

                            {/* Published Date */}
                            {publication?.created_at && (
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Published
                                    </p>
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

                        {/* Actions */}
                        <div className="mt-6 flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast.success("Publication link copied to clipboard!");
                                }}
                                className="transition-all duration-200 hover:scale-105 group"
                            >
                                <Share2 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                                Share Publication
                            </Button>
                        </div>
                    </div>
                </aside>

                {/* Right: PDF Viewer */}
                <section className="lg:col-span-8">
                    <div className="rounded-2xl bg-neutral-100 outline dark:bg-neutral-800 border overflow-hidden shadow-lg">
                        <DFlipViewer
                            key={`${pdfFile.name}-${forceRerender}`}
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
            </main>

        </>
    );
}
