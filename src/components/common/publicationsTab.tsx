'use client';

import React, { useState } from 'react';
import { AlertDialog, Button } from '@/components';
import { Calendar, Edit, Eye, FileText, Trash2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { usePublications } from '@/components';
import { createClient } from '@/lib/database/supabase/client';
import { toastify } from './toastify';
import { NoPublications } from '@/layout/no-publications';

export default function PublicationsTab() {
    const router = useRouter();
    const { publications, loading, deletePublication, refreshPublications } = usePublications();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingPublicationId, setDeletingPublicationId] = useState<string | null>(null);
    const [deletingIdInProgress, setDeletingIdInProgress] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Refresh mechanism
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshPublications();
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleDeleteClick = (pubId: string) => {
        setDeletingPublicationId(pubId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingPublicationId) return;

        setDeletingIdInProgress(deletingPublicationId); // track deleting ID

        try {
            const supabase = createClient();

            const { data: publication, error: fetchError } = await supabase
                .from('publications')
                .select('*')
                .eq('id', deletingPublicationId)
                .single();
            if (fetchError) throw fetchError;
            if (!publication) throw new Error('Publication not found');

            const { error: deleteError } = await supabase
                .from('publications')
                .delete()
                .eq('id', deletingPublicationId);
            if (deleteError) throw deleteError;

            const deleteStorageFile = async (url: string) => {
                if (!url) return;
                const pathInsideBucket = decodeURIComponent(
                    url.split('/public/publications/')[1]
                );
                if (pathInsideBucket) {
                    const { error: storageError } = await supabase
                        .storage
                        .from('publications')
                        .remove([pathInsideBucket]);
                    if (storageError) console.warn('Storage delete error:', storageError);
                }
            };

            await deleteStorageFile(publication.pdf_url);
            await deleteStorageFile(publication.thumb_url);

            deletePublication(deletingPublicationId);
            toastify.success('Successfully deleted publication');

            // Close dialog only after deletion success
            setDeleteDialogOpen(false);
            setDeletingPublicationId(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            toastify.error(`Failed to delete publication: ${errorMessage}`);
        } finally {
            setDeletingIdInProgress(null);
        }
    };

    const handleDeleteCancel = () => {
        if (deletingIdInProgress) return; // prevent cancel while deleting
        setDeleteDialogOpen(false);
        setDeletingPublicationId(null);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getPublicationToDelete = () => {
        return publications.find(pub => pub.id === deletingPublicationId);
    };

    return (
        <div>
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground mb-4">Loading publications...</p>
                </div>
            ) : publications.length === 0 ? (
                <NoPublications/>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Your Publications</h3>
                            <p className="text-sm text-muted-foreground">{publications.length} publication{publications.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="flex flex-col items-center gap-2 sm:flex-row md:flex-row">
                            <Button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                variant="outline"
                                size="sm"
                                className="transition-all duration-200 hover:scale-105"
                            >
                                {isRefreshing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                                        Refreshing...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4" />
                                        Refresh
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.href = '/profile'}
                                className="bg-card border border-border/30 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300"
                            >
                                View All
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {publications.map((pub) => (
                            <div
                                key={pub.id}
                                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 glass border border-border rounded-xl shadow-soft hover:shadow-glow transition-all duration-300 hover:scale-102"
                            >
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                    {pub.thumb_url ? (
                                        <Image
                                            src={pub.thumb_url}
                                            alt="Thumbnail"
                                            width={60}
                                            height={60}
                                            className="w-15 h-15 object-cover rounded-lg shrink-0"
                                        />
                                    ) : (
                                        <div className="w-15 h-15 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                                            <FileText className="w-6 h-6 text-primary" />
                                        </div>
                                    )}
                                    <div className="flex flex-col min-w-0">
                                        <h4 className="font-semibold text-foreground mb-1 truncate">
                                            {pub.title}
                                        </h4>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2 overflow-hidden">
                                            {pub.description}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(pub.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            window.location.href = `/view?id=${encodeURIComponent(pub.id)}`

                                        }
                                        className="hover:bg-primary/10 transition-all duration-300"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.push(`/profile?edit=${pub.id}`)}
                                        className="hover:bg-primary/10 transition-all duration-300"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={deletingIdInProgress !== null} // disable all deletes while one in progress
                                        onClick={() => handleDeleteClick(pub.id)}
                                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 transition-all duration-300"
                                    >
                                        {deletingIdInProgress === pub.id ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive"></div>
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Publication"
                description={`Are you sure you want to delete "${getPublicationToDelete()?.title}"? This action cannot be undone and will permanently remove the publication from your account.`}
                confirmText={deletingIdInProgress ? "Deleting..." : "Delete Publication"}
                cancelText="Cancel"
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                variant="destructive"
                isLoading={!!deletingIdInProgress}
            />
        </div>
    );
}
