"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/database/supabase/client';
import { CheckCircle, FileText, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { DFlipViewer, Label, usePdfUpload } from '@/components';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { toastify } from '@/components/toastify';
import { useDropzone } from 'react-dropzone';
import { generatePdfThumbnailDataUrl } from '@/utils/pdfThumbnail';

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const steps = [
  'Upload',
  'Details',
  'Preview',
  'Review',
  'Share',
];

export default function CreatePublicationPage() {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pdf, setPdf] = useState<File | null>(null);
  const [published, setPublished] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [thumbUrl, setThumbUrl] = useState('');
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState('');
  const [error, setError] = useState('');
  const [uploadRetries, setUploadRetries] = useState(0);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [hasShownToast, setHasShownToast] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [publicationId, setPublicationId] = useState<string | null>(null); // <== Add after other useState hooks

  const { pdf: pdfCtx, setPdf: setPdfCtx, clearPdf, loadStoredPdf, storedPdfData } = usePdfUpload();
  const router = useRouter();
  const [isLoadingStoredPdf, setIsLoadingStoredPdf] = useState(false);

  const [viewerKey, setViewerKey] = useState(0);
  const [isViewerReady, setIsViewerReady] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCompleted || (step === 4 && published)) {
        return;
      }
      // Only show warning if user has made progress
      if (pdf || title.trim() || description.trim() || step > 0) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pdf, title, description, step, isCompleted, published]);

  useEffect(() => {
    const initializePdf = async () => {
      // Prevent multiple initializations
      if (hasShownToast) return;

      try {
        // Priority 1: Check if we have a PDF in context with actual file
        if (pdfCtx?.file && !pdf) {
          setPdf(pdfCtx.file);
          setHasShownToast(true);
          return;
        }

        if (storedPdfData && !pdf && !pdfCtx?.file) {
          setIsLoadingStoredPdf(true);
          try {
            const restoredFile = await loadStoredPdf();
            if (restoredFile) {
              setPdf(restoredFile);
              setHasShownToast(true);
              return;
            }
          } catch (error) {
            console.error('Error restoring PDF:', error);
          } finally {
            setIsLoadingStoredPdf(false);
          }
        }

        if (pdfCtx?.name && !pdfCtx.file && !storedPdfData && !pdf) {
          toastify.error("Your upload session expired. Please upload your PDF again.");
          setHasShownToast(true);
          return;
        }

        // If we reach here and still no PDF, mark as shown to prevent loops
        if (!pdf && !hasShownToast) {
          setHasShownToast(true);
        }
      } catch (error) {
        console.error('Error initializing PDF:', error);
        toastify.error("Something went wrong. Please try again.");
        setHasShownToast(true);
      }
    };

    initializePdf();
  }, [pdfCtx, pdf, hasShownToast, storedPdfData, loadStoredPdf, router]);

  // Fix 1: Better viewer initialization logic
  useEffect(() => {
    if (step === 2 && pdf) {
      setIsViewerReady(false);

      // Generate a new key to force re-render of viewer
      setViewerKey(prev => prev + 1);

      // Longer delay to ensure everything is properly mounted
      const timer = setTimeout(() => {
        setIsViewerReady(true);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setIsViewerReady(false);
    }
  }, [step, pdf]);

  // When a PDF is selected, store it in context and generate thumbnail
  const handlePdfChange = async (file: File | null) => {
    setPdf(file);
    if (file) {
      setPdfCtx({ file, name: file.name, lastModified: file.lastModified });

      // Generate thumbnail for the PDF
      try {
        const thumbnailDataUrl = await generatePdfThumbnailDataUrl(file, {
          width: 300,
          height: 400,
          page: 1,
          quality: 0.8
        });
        setThumbnailDataUrl(thumbnailDataUrl);
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
      }
    } else {
      clearPdf();
      setThumbnailDataUrl('');
      setThumbUrl('');
    }
  };

  const handleNext = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  // Fix 2: Improved publish function with better error handling and state management
  const handlePublish = async (retryCount = 0) => {
    console.log("Publishing started", { title, description, pdfName: pdf?.name, retryCount });

    // Reset states at the beginning
    setError('');
    setUploading(true);
    setUploadRetries(retryCount);

    // Validate required fields
    if (!pdf) {
      setError('No PDF file selected');
      setUploading(false);
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      setUploading(false);
      return;
    }

    // Check file size and warn user if it's very large
    if (pdf.size > 25 * 1024 * 1024) { // 25MB
      const confirmed = window.confirm(
        `Your file is ${(pdf.size / (1024 * 1024)).toFixed(1)} MB. Large files may take several minutes to upload. Continue?`
      );
      if (!confirmed) {
        setUploading(false);
        return;
      }
    }

    const supabase = createClient();
    let pdfPath = '';
    let pdfPublicUrl = '';

    try {
      // Get current user first
      console.log("Getting user...");
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log("User not authenticated, redirecting to register");
        // Store state and redirect to register
        localStorage.setItem('flippress_publish_redirect', JSON.stringify({
          title,
          description,
          pdfMeta: { file: pdf, name: pdf.name, lastModified: pdf.lastModified },
          step,
        }));
        toastify.info('You need to be logged in to publish.');
        setUploading(false);
        router.push('/auth/register?next=/home/create');
        return;
      }

      console.log("User authenticated:", user.id);

      // Create a fresh File object to avoid any stale references
      const freshPdf = new File([pdf], pdf.name, {
        type: pdf.type,
        lastModified: pdf.lastModified
      });

      console.log("Uploading PDF to storage...");
      pdfPath = `pdfs/${Date.now()}_${freshPdf.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('publications')
        .upload(pdfPath, freshPdf, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }


      // Upload thumbnail if available
      let thumbnailPublicUrl = '';
      if (thumbnailDataUrl) {
        try {
          console.log("Uploading thumbnail to storage...");

          // Convert data URL to blob
          const response = await fetch(thumbnailDataUrl);
          const thumbnailBlob = await response.blob();

          // Create thumbnail file
          const thumbnailFile = new File([thumbnailBlob], `thumb_${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          const thumbnailPath = `thumbs/${Date.now()}_${thumbnailFile.name}`;
          const { error: thumbUploadError } = await supabase.storage
            .from('publications')
            .upload(thumbnailPath, thumbnailFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (thumbUploadError) {
            console.error("Thumbnail upload error:", thumbUploadError);
            console.warn("Thumbnail upload failed, continuing without thumbnail");
          } else {
            console.log("Thumbnail uploaded successfully to:", thumbnailPath);
            const { data: thumbUrlData } = supabase.storage.from('publications').getPublicUrl(thumbnailPath);
            thumbnailPublicUrl = thumbUrlData.publicUrl;
            setThumbUrl(thumbnailPublicUrl);
          }
        } catch (thumbError) {
          console.error("Error processing thumbnail:", thumbError);
          console.warn("Thumbnail processing failed, continuing without thumbnail");
        }
      }

      // Insert publication row
      console.log("Inserting publication into database...");
      const { data: insertData, error: insertError } = await supabase.from('publications').insert([
        {
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          pdf_url: pdfPublicUrl,
          thumb_url: thumbnailPublicUrl || null,
        }
      ]).select();

      if (insertError) {
        console.error("Database insert error:", insertError);
        throw new Error(`Database error: ${insertError.message}`);
      }

      console.log("Publication created successfully!", insertData);
      if (insertData && insertData.length > 0) {
        setPublicationId(insertData[0].id);
      }

      // Set published state and move to next step
      setPublished(true);
      handleNext();

      // Clear the PDF context after successful publish
      setTimeout(() => {
        clearPdf();
      }, 1000);

      // Show success message
      toast.success('Publication published successfully!');

    } catch (e: unknown) {
      console.error("Publishing error:", e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Failed to publish: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  // On mount, if redirected from register, restore state
  useEffect(() => {
    const redirectData = localStorage.getItem('flippress_publish_redirect');
    if (redirectData) {
      try {
        const { title, description, pdfMeta, step } = JSON.parse(redirectData);
        setTitle(title || '');
        setDescription(description || '');
        setStep(step || 0);

        // If we have pdfMeta and it contains the file data, restore it
        if (pdfMeta && pdfMeta.file) {
          setPdf(pdfMeta.file);
          setPdfCtx(pdfMeta);
        }
      } catch (error) {
        console.error('Error restoring redirect data:', error);
      }
      localStorage.removeItem('flippress_publish_redirect');
    }
  }, [setPdfCtx]);

  const onDrop = React.useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (acceptedFiles.length > 0) {
      handlePdfChange(acceptedFiles[0]);
      setError('');
    } else if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
        setError(`File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      } else if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
        setError('Invalid file type. Please upload a supported file: PDF, EPUB, image, CBZ, or ZIP.');
      } else {
        setError('File upload failed. Please try again.');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      // I will add support for more formats later
      // 'application/epub+zip': ['.epub'],
      // 'application/vnd.ms-powerpoint': ['.ppt'],
      // 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      // 'application/msword': ['.doc'],
      // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  useEffect(() => {
    if (step > 0 && !pdf) {
      setStep(0);
      toastify.error('You must upload a PDF before continuing.');
    }
  }, [step, pdf]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 py-8 px-2">
      <div className="w-full max-w-2xl glass shadow-xl rounded-2xl p-0 sm:p-0 overflow-hidden">
        {/* Stepper */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          {steps.map((label, idx) => (
            <div key={label} className="flex-1 flex flex-col items-center">
              <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition-colors duration-200 ${idx === step ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border'} ${idx < step ? 'bg-primary/80 text-primary-foreground border-primary' : ''}`}>
                {idx < step ? <CheckCircle className="w-5 h-5" /> : idx + 1}
              </div>
              <span className={`mt-2 text-xs font-medium ${idx === step ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
            </div>
          ))}
        </div>
        <div className="border-b border-border mx-8" />

        {/* Content */}
        <div className="p-8">
          {!pdf && step > 0 && (
            <div className="text-destructive text-center p-4 font-bold bg-red-50 border border-red-200 rounded mb-4">
              You must upload a PDF before continuing. Please upload your file to proceed.
            </div>
          )}
          {error && <div className="text-destructive mb-4 text-center">{error}</div>}

          {step === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[350px]">
              <div
                {...getRootProps()}
                className={`relative overflow-hidden rounded-2xl p-8 text-center cursor-pointer transition-all duration-500 glass border-2 border-dashed shadow-soft hover:shadow-upload focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  ${isDragActive && !isDragReject ? 'border-primary bg-primary/5 shadow-glow scale-105' : ''}
                  ${isDragReject ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : ''}
                  ${!isDragActive && !isDragReject ? 'border-primary/30 hover:border-primary/60 hover:scale-[1.02]' : ''}
                `}
                role="button"
                tabIndex={0}
                aria-label="Upload file by dragging and dropping or clicking to browse"
              >
                <input {...getInputProps()} />
                <div className="relative">
                  <div className={`flex items-center justify-center w-24 h-24 mx-auto mb-6 rounded-2xl transition-all duration-300 ${isDragReject ? 'bg-red-100 dark:bg-red-900/30 animate-wiggle' : 'bg-gradient-hero shadow-glow'}`}>
                    <FileText className={`w-12 h-12 transition-colors ${isDragReject ? 'text-red-600 dark:text-red-400' : 'text-primary'}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    {isDragActive && !isDragReject
                      ? 'Drop your file here'
                      : isDragReject
                        ? 'Invalid file type'
                        : 'Drag & Drop your file'}
                  </h3>
                  <p className="text-muted-foreground mb-6 text-lg">
                    {isDragActive && !isDragReject
                      ? 'Release to upload your file'
                      : isDragReject
                        ? 'Please select a supported file type'
                        : 'Drag your file here, or click to browse'}
                  </p>
                  <div className="text-sm text-muted-foreground mb-8 space-y-1">
                    <p>Maximum file size: {MAX_FILE_SIZE / 1024 / 1024}MB</p>
                    <p>Supported formats: PDF, EPUB</p>
                  </div>
                  <Button
                    type="button"
                    className="hover:shadow-glow text-white shadow-soft hover:scale-105 px-8 py-4 text-lg"
                    size="lg"
                  >
                    <UploadCloud className="w-5 h-5 mr-3" />
                    Browse Files
                  </Button>
                </div>
              </div>

              {/* Show file info and continue button if file is selected */}
              {pdf && (
                <div className="mt-6 w-full max-w-md text-center">
                  {/* Thumbnail preview */}
                  {thumbnailDataUrl && (
                    <div className="mb-4 flex justify-center">
                      <div className="w-24 h-32 rounded-lg border border-border overflow-hidden bg-white shadow-sm">
                        <img
                          src={thumbnailDataUrl}
                          alt="PDF Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  <div className="font-semibold text-lg text-primary">{pdf.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{(pdf.size / 1024 / 1024).toFixed(2)} MB</div>

                  <div className="flex gap-2 mt-4 justify-center">
                    <Button variant="outline" size="sm" onClick={() => handlePdfChange(null)} className="cursor-pointer">Remove File</Button>
                    <Button variant="outline" size="sm" onClick={() => pdfInputRef.current?.click()} className="cursor-pointer">Choose Different File</Button>
                  </div>
                  <Button onClick={handleNext} className="w-full mt-4 cursor-pointer" size="lg">Continue to Details</Button>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-foreground">Title</label>
                <Input
                  placeholder="Enter a title for your publication"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full glass border-2 rounded-md p-2 focus:border-primary/50 h-12 text-lg font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-3 text-foreground">Description</label>
                <Textarea
                  placeholder="Describe your publication"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="glass shadow-soft focus:shadow-glow focus:border-primary/50 transition-all duration-300 min-h-[100px] resize-none"
                />
              </div>
              <div className="flex gap-3 justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className='cursor-pointer border-border/50 hover:border-border hover:bg-muted/50 transition-all duration-300'
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!title || !description}
                  className='cursor-pointer hover:shadow-glow text-white shadow-soft hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-semibold text-center">Preview your PDF</h2>
              {pdf ? (
                <div className="border rounded-lg overflow-hidden w-full h-full min-h-[400px]">
                  {!isViewerReady ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Initializing PDF viewer...</span>
                      </div>
                    </div>
                  ) : (
                    <DFlipViewer
                      key={viewerKey}
                      pdfFile={pdf}
                      options={{
                        webgl: true,
                        autoEnableOutline: true,
                        pageMode: typeof window !== 'undefined' && window.innerWidth <= 768 ? 1 : 2,
                        singlePageMode: typeof window !== 'undefined' && window.innerWidth <= 768 ? 1 : 0,
                        responsive: true,
                        height: typeof window !== 'undefined' && window.innerWidth >= 1024 ? 700 :
                          typeof window !== 'undefined' && window.innerWidth >= 768 ? 600 : 400,
                      }}
                    />
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center">No PDF selected for preview.</p>
              )}
              <div className="flex gap-2 justify-between mt-2">
                <Button variant="secondary" onClick={handleBack} className='cursor-pointer'>Back</Button>
                <Button onClick={handleNext} disabled={!pdf} className="cursor-pointer">Next</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 flex items-center justify-center rounded-xl bg-muted border border-border overflow-hidden">
                  {thumbnailDataUrl ? (
                    <img
                      src={thumbnailDataUrl}
                      alt="PDF Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                  <div id='title' className="font-semibold text-lg text-foreground">{title}</div>

                  <Label className="text-sm mt-2 font-medium text-gray-400">Description</Label>
                  <div id='description' className="text-foreground text-lg mt-1">{description}</div>
                  <div className="mt-2 flex items-center gap-2 border border-border rounded-lg p-2 bg-muted">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-medium text-sm font-medium">{pdf?.name}</span>
                  </div>
                  {thumbnailDataUrl && (
                    <div className="mt-2 flex items-center gap-2 border border-green-200 rounded-lg p-2 bg-green-50">
                      <ImageIcon className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 text-sm font-medium">Thumbnail generated</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 justify-between mt-2">
                <Button variant="secondary" onClick={handleBack} disabled={uploading} className='cursor-pointer'>Back</Button>
                <Button onClick={() => handlePublish()} disabled={uploading || !title.trim() || !description.trim()} className={uploading ? 'opacity-75' : 'cursor-pointer'}>
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white text-white border-t-transparent rounded-full animate-spin"></div>
                      Publishing...
                    </div>
                  ) : (
                    'Publish'
                  )}
                </Button>
              </div>
              {uploading && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-sm text-muted-foreground">Uploading to cloud storage...</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {pdf && `File size: ${(pdf.size / (1024 * 1024)).toFixed(1)} MB`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {pdf && pdf.size > 10 * 1024 * 1024 ?
                      `Large file detected. This may take several minutes. Please don't close this page.` :
                      `This may take a few moments. Please don't close this page.`
                    }
                  </div>
                </div>
              )}
              {error && !uploading && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5">⚠️</div>
                    <div className="flex-1">
                      <p className="text-red-800 dark:text-red-200 text-sm font-medium mb-1">
                        Upload Failed
                      </p>
                      <p className="text-red-700 dark:text-red-300 text-sm mb-3">
                        {error}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handlePublish(uploadRetries + 1)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Retry Upload
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setError('')}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && published && (
            <div className="flex flex-col gap-6 items-center text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-2">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-lg font-bold text-green-700 dark:text-green-400">Publication Created!</div>
              <div className="w-full">
                <div className="text-muted-foreground text-xs mb-1">Share your publication link:</div>
                <div className="flex flex-col gap-2 items-center justify-center">
                  <span
                    onClick={() => { if (publicationId) {navigator.clipboard.writeText(`flippress.vercel.app/view?id=${publicationId}`); toastify.success("Copied to clipboard!");}}}
                    className="bg-muted border-border rounded-2xl cursor-pointer p-2" >{title}</span>
                  <Button size="sm" variant="outline" onClick={() => { if (publicationId) {window.open(`/view?id=${publicationId}`, '_blank');}}} className='cursor-pointer' >View</Button>
                </div>
                <Button
                  className='w-full mt-2 cursor-pointer'
                  onClick={() => {
                    setIsCompleted(true);
                    window.location.href = `/`;
                  }}
                >
                  Finish
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
