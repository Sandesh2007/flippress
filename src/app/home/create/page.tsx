"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Input, Label, Button, Textarea } from '@/components/ui';
import { createClient } from '@/lib/database/supabase/client';
import { CheckCircle, FileText, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { DFlipViewer, usePdfUpload } from '@/components/common';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { toastify } from '@/components/common/toastify';
import { useDropzone } from 'react-dropzone';
import { generatePdfThumbnailDataUrl } from '@/utils/pdfThumbnail';

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const steps = [
  { label: 'Upload', shortLabel: 'Upload' },
  { label: 'Details', shortLabel: 'Details' },
  { label: 'Preview', shortLabel: 'Preview' },
  { label: 'Review', shortLabel: 'Review' },
  { label: 'Share', shortLabel: 'Share' },
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
  const [publicationId, setPublicationId] = useState<string | null>(null);

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
      if (hasShownToast) return;

      try {
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

  useEffect(() => {
    if (step === 2 && pdf) {
      setIsViewerReady(false);
      setViewerKey(prev => prev + 1);
      const timer = setTimeout(() => {
        setIsViewerReady(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsViewerReady(false);
    }
  }, [step, pdf]);

  const handlePdfChange = async (file: File | null) => {
    setPdf(file);
    if (file) {
      setPdfCtx({ file, name: file.name, lastModified: file.lastModified });

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

  const handlePublish = async (retryCount = 0) => {
    console.log("Publishing started", { title, description, pdfName: pdf?.name, retryCount });

    setError('');
    setUploading(true);
    setUploadRetries(retryCount);

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

    if (pdf.size > 25 * 1024 * 1024) {
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
      console.log("Getting user...");
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log("User not authenticated, redirecting to register");
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

      const { data: pdfUrlData } = supabase.storage.from('publications').getPublicUrl(pdfPath);
      pdfPublicUrl = pdfUrlData.publicUrl;

      let thumbnailPublicUrl = '';
      if (thumbnailDataUrl) {
        try {
          console.log("Uploading thumbnail to storage...");

          const response = await fetch(thumbnailDataUrl);
          const thumbnailBlob = await response.blob();

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

      setPublished(true);
      handleNext();

      setTimeout(() => {
        clearPdf();
      }, 1000);

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

  useEffect(() => {
    const redirectData = localStorage.getItem('flippress_publish_redirect');
    if (redirectData) {
      try {
        const { title, description, pdfMeta, step } = JSON.parse(redirectData);
        setTitle(title || '');
        setDescription(description || '');
        setStep(step || 0);

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
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header with Stepper - Mobile Optimized */}
        <div className="glass shadow-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[280px] sm:min-w-0 max-w-4xl mx-auto">
            {steps.map((stepItem, idx) => (
              <div key={stepItem.label} className="flex-1 flex flex-col items-center relative">
                {idx > 0 && (
                  <div className={`absolute right-1/2 top-3 sm:top-4 w-full h-0.5 -z-10 transition-colors duration-300 ${idx <= step ? 'bg-primary' : 'bg-border'}`} />
                )}
                <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-full border-2 transition-all duration-300 
                  ${idx === step ? 'bg-primary text-primary-foreground border-primary scale-110 shadow-lg' : 'bg-muted text-muted-foreground border-border'} 
                  ${idx < step ? 'bg-primary/80 text-primary-foreground border-primary' : ''}`}>
                  {idx < step ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" /> : <span className="text-xs sm:text-sm lg:text-lg font-bold">{idx + 1}</span>}
                </div>
                <span className={`mt-1.5 sm:mt-2 lg:mt-3 text-[10px] sm:text-xs lg:text-sm font-semibold text-center leading-tight ${idx === step ? 'text-primary' : 'text-muted-foreground'}`}>
                  <span className="hidden sm:inline">{stepItem.label}</span>
                  <span className="sm:hidden">{stepItem.shortLabel}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="glass shadow-xl rounded-xl sm:rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8 xl:p-12">
            {!pdf && step > 0 && (
              <div className="text-destructive text-center p-4 sm:p-6 font-bold bg-red-50 border-2 border-red-200 rounded-lg sm:rounded-xl mb-4 sm:mb-6 lg:mb-8 text-sm sm:text-base lg:text-lg">
                You must upload a PDF before continuing. Please upload your file to proceed.
              </div>
            )}
            {error && <div className="text-destructive mb-4 sm:mb-6 text-center text-sm sm:text-base lg:text-lg font-semibold">{error}</div>}

            {/* Step 0: Upload */}
            {step === 0 && (
              <div className="max-w-5xl mx-auto">
                <div
                  {...getRootProps()}
                  className={`relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl p-6 sm:p-10 lg:p-16 text-center cursor-pointer transition-all duration-500 glass border-2 border-dashed shadow-soft hover:shadow-upload focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] flex flex-col items-center justify-center
                    ${isDragActive && !isDragReject ? 'border-primary bg-primary/5 shadow-glow scale-[1.02]' : ''}
                    ${isDragReject ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : ''}
                    ${!isDragActive && !isDragReject ? 'border-primary/30 hover:border-primary/60 hover:scale-[1.01]' : ''}
                  `}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload file by dragging and dropping or clicking to browse"
                >
                  <input {...getInputProps()} />
                  <div className="relative w-full">
                    <div className={`flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 mx-auto mb-4 sm:mb-6 lg:mb-8 rounded-2xl lg:rounded-3xl transition-all duration-300 ${isDragReject ? 'bg-red-100 dark:bg-red-900/30 animate-wiggle' : 'bg-gradient-hero shadow-glow'}`}>
                      <FileText className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 transition-colors ${isDragReject ? 'text-red-600 dark:text-red-400' : 'text-primary'}`} />
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 lg:mb-6 px-2">
                      {isDragActive && !isDragReject
                        ? 'Drop your file here'
                        : isDragReject
                          ? 'Invalid file type'
                          : 'Drag & Drop your file'}
                    </h3>
                    <p className="text-muted-foreground mb-4 sm:mb-6 lg:mb-8 text-sm sm:text-base lg:text-xl px-2">
                      {isDragActive && !isDragReject
                        ? 'Release to upload your file'
                        : isDragReject
                          ? 'Please select a supported file type'
                          : 'Drag your file here, or click to browse'}
                    </p>
                    <div className="text-xs sm:text-sm lg:text-base text-muted-foreground mb-6 sm:mb-8 lg:mb-10 space-y-1 sm:space-y-2 px-2">
                      <p className="font-medium">Maximum file size: {MAX_FILE_SIZE / 1024 / 1024}MB</p>
                      <p>Supported formats: PDF, EPUB</p>
                    </div>
                    <Button
                      type="button"
                      className="hover:shadow-glow text-white shadow-soft hover:scale-105 px-6 py-3 sm:px-8 sm:py-4 lg:px-10 lg:py-6 text-sm sm:text-base lg:text-xl font-semibold"
                      size="lg"
                    >
                      <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2 sm:mr-3" />
                      Browse Files
                    </Button>
                  </div>
                </div>

                {pdf && (
                  <div className="mt-6 sm:mt-8 lg:mt-10 w-full max-w-2xl mx-auto">
                    <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-border">
                      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
                        {thumbnailDataUrl && (
                          <div className="w-24 h-32 sm:w-28 sm:h-36 lg:w-32 lg:h-40 rounded-lg sm:rounded-xl border-2 border-border overflow-hidden bg-white shadow-md flex-shrink-0">
                            <img
                              src={thumbnailDataUrl}
                              alt="PDF Thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 text-center sm:text-left">
                          <div className="font-bold text-lg sm:text-xl lg:text-2xl text-primary mb-1 sm:mb-2 break-all">{pdf.name}</div>
                          <div className="text-sm sm:text-base text-muted-foreground">{(pdf.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                        <Button variant="outline" size="default" onClick={() => handlePdfChange(null)} className="cursor-pointer text-sm sm:text-base px-4 sm:px-6 w-full sm:w-auto">Remove File</Button>
                        <Button variant="outline" size="default" onClick={() => pdfInputRef.current?.click()} className="cursor-pointer text-sm sm:text-base px-4 sm:px-6 w-full sm:w-auto">Choose Different File</Button>
                      </div>
                      <Button onClick={handleNext} className="w-full mt-4 sm:mt-6 cursor-pointer text-base sm:text-lg py-4 sm:py-6" size="lg">Continue to Details →</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Details */}
            {step === 1 && (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-6 sm:mb-8 lg:mb-10">Publication Details</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  <div className="space-y-6 lg:space-y-8 order-2 lg:order-1">
                    <div>
                      <label className="block text-base sm:text-lg font-semibold mb-2 sm:mb-4 text-foreground">Title</label>
                      <Input
                        placeholder="Enter a compelling title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full glass border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 focus:border-primary/50 h-12 sm:h-14 text-base sm:text-lg font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-base sm:text-lg font-semibold mb-2 sm:mb-4 text-foreground">Description</label>
                      <Textarea
                        placeholder="Describe your publication in detail"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="glass shadow-soft focus:shadow-glow focus:border-primary/50 transition-all duration-300 min-h-[150px] sm:min-h-[200px] resize-none text-sm sm:text-base p-3 sm:p-4"
                      />
                    </div>
                  </div>
                  <div className="glass rounded-lg sm:rounded-xl p-4 sm:p-6 border border-border flex flex-col justify-center order-1 lg:order-2">
                    <h3 className="text-lg sm:text-xl font-semibold mb-4 text-center lg:text-left">Preview</h3>
                    {thumbnailDataUrl && (
                      <div className="mb-4 flex justify-center">
                        <div className="w-32 h-44 sm:w-40 sm:h-56 lg:w-48 lg:h-64 rounded-lg sm:rounded-xl border-2 border-border overflow-hidden bg-white shadow-md">
                          <img
                            src={thumbnailDataUrl}
                            alt="PDF Thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="font-bold text-lg sm:text-xl text-foreground mb-2 break-words">{title || 'Untitled'}</div>
                      <div className="text-muted-foreground text-xs sm:text-sm line-clamp-3">{description || 'No description yet'}</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between mt-6 sm:mt-8 lg:mt-10">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    size="lg"
                    className='cursor-pointer border-border/50 hover:border-border hover:bg-muted/50 transition-all duration-300 text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto order-2 sm:order-1'
                  >
                    ← Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!title || !description}
                    size="lg"
                    className='cursor-pointer hover:shadow-glow text-white shadow-soft hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto order-1 sm:order-2'
                  >
                    Next →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Preview */}
            {step === 2 && (
              <div className="max-w-7xl mx-auto">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-4 sm:mb-6 lg:mb-8">Preview Your Publication</h2>
                {pdf ? (
                  <div className="border-2 rounded-xl sm:rounded-2xl overflow-hidden w-full min-h-[400px] sm:min-h-[500px] lg:min-h-[700px] shadow-lg">
                    {!isViewerReady ? (
                      <div className="flex items-center justify-center h-64 sm:h-80 lg:h-96">
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-base sm:text-lg lg:text-xl text-center">Initializing PDF viewer...</span>
                        </div>
                      </div>
                    ) : (
                      <DFlipViewer
                        key={viewerKey}
                        pdfFile={pdf}
                        options={{
                          webgl: true,
                          autoEnableOutline: true,
                          pageMode: window.innerWidth <= 768 ? 1 : 2,
                          singlePageMode: window.innerWidth <= 768 ? 1 : 0,
                          responsive: true,
                          height: window.innerWidth >= 1024 ? 800 :
                            window.innerWidth >= 768 ? 600 : 400,
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center text-base sm:text-lg lg:text-xl">No PDF selected for preview.</p>
                )}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between mt-6 sm:mt-8">
                  <Button variant="secondary" onClick={handleBack} size="lg" className='cursor-pointer text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto order-2 sm:order-1'>← Back</Button>
                  <Button onClick={handleNext} disabled={!pdf} size="lg" className="cursor-pointer text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto order-1 sm:order-2">Next →</Button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="max-w-5xl mx-auto">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-6 sm:mb-8 lg:mb-10">Review & Publish</h2>
                <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-10 border border-border">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 mb-6 sm:mb-8">
                    <div className="w-32 h-44 sm:w-40 sm:h-56 lg:w-48 lg:h-64 flex items-center justify-center rounded-xl sm:rounded-2xl bg-muted border-2 border-border overflow-hidden flex-shrink-0">
                      {thumbnailDataUrl ? (
                        <img
                          src={thumbnailDataUrl}
                          alt="PDF Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-4 sm:space-y-6 w-full">
                      <div className="text-center sm:text-left">
                        <Label className="text-sm sm:text-base font-semibold text-muted-foreground mb-1 sm:mb-2 block">Title</Label>
                        <div id='title' className="font-bold text-xl sm:text-2xl lg:text-3xl text-foreground break-words">{title}</div>
                      </div>

                      <div className="text-center sm:text-left">
                        <Label className="text-sm sm:text-base font-semibold text-muted-foreground mb-1 sm:mb-2 block">Description</Label>
                        <div id='description' className="text-foreground text-sm sm:text-base lg:text-lg leading-relaxed">{description}</div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 border-2 border-border rounded-lg sm:rounded-xl p-3 sm:p-4 bg-muted">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                        <span className="text-sm sm:text-base font-semibold break-all flex-1">{pdf?.name}</span>
                        <span className="text-xs sm:text-sm text-muted-foreground">{pdf && (pdf.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      {thumbnailDataUrl && (
                        <div className="flex items-center gap-2 sm:gap-3 border-2 border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-green-50">
                          <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                          <span className="text-green-600 text-sm sm:text-base font-semibold">Thumbnail generated successfully</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between">
                    <Button variant="secondary" onClick={handleBack} disabled={uploading} size="lg" className='cursor-pointer text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto order-2 sm:order-1'>← Back</Button>
                    <Button onClick={() => handlePublish()} disabled={uploading || !title.trim() || !description.trim()} size="lg" className={`${uploading ? 'opacity-75' : 'cursor-pointer'} text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto order-1 sm:order-2`}>
                      {uploading ? (
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white text-white border-t-transparent rounded-full animate-spin"></div>
                          Publishing...
                        </div>
                      ) : (
                        'Publish Now'
                      )}
                    </Button>
                  </div>

                  {uploading && (
                    <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-muted rounded-lg sm:rounded-xl border border-border">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-primary rounded-full animate-pulse"></div>
                        <span className="text-sm sm:text-base font-semibold text-muted-foreground">Uploading to cloud storage...</span>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
                        {pdf && `File size: ${(pdf.size / (1024 * 1024)).toFixed(1)} MB`}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {pdf && pdf.size > 10 * 1024 * 1024 ?
                          `Large file detected. This may take several minutes. Please don't close this page.` :
                          `This may take a few moments. Please don't close this page.`
                        }
                      </div>
                    </div>
                  )}

                  {error && !uploading && (
                    <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg sm:rounded-xl">
                      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400 text-lg sm:text-xl flex-shrink-0">⚠️</div>
                        <div className="flex-1 w-full">
                          <p className="text-red-800 dark:text-red-200 text-sm sm:text-base font-semibold mb-1 sm:mb-2">
                            Upload Failed
                          </p>
                          <p className="text-red-700 dark:text-red-300 text-sm sm:text-base mb-3 sm:mb-4 break-words">
                            {error}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <Button
                              size="default"
                              onClick={() => handlePublish(uploadRetries + 1)}
                              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                            >
                              Retry Upload
                            </Button>
                            <Button
                              size="default"
                              variant="outline"
                              onClick={() => setError('')}
                              className="w-full sm:w-auto"
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Success/Share */}
            {step === 4 && published && (
              <div className="max-w-4xl mx-auto">
                <div className="glass rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 text-center border border-border">
                  <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-green-100 dark:bg-green-900/20 mb-4 sm:mb-6 mx-auto shadow-lg">
                    <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-700 dark:text-green-400 mb-6 sm:mb-8">🎉 Publication Created Successfully!</div>

                  <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6">
                    <div className="glass rounded-lg sm:rounded-xl p-4 sm:p-6 border border-border">
                      <div className="text-muted-foreground text-sm sm:text-base mb-3 sm:mb-4 font-semibold">Share your publication:</div>
                      <div className="flex flex-col gap-3 sm:gap-4 items-center justify-center">
                        <div className="w-full">
                          <div
                            onClick={() => { if (publicationId) { navigator.clipboard.writeText(`flippress.vercel.app/view?id=${publicationId}`); toastify.success("Copied to clipboard!"); } }}
                            className="bg-muted border-2 border-border rounded-lg sm:rounded-xl cursor-pointer p-4 sm:p-6 hover:bg-muted/80 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] text-left"
                          >
                            <div className="text-base sm:text-lg lg:text-xl font-bold text-foreground mb-1 sm:mb-2 break-words">{title}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground font-mono break-all">
                              {publicationId ? `flippress.vercel.app/view?id=${publicationId}` : 'Loading...'}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={() => { if (publicationId) { window.open(`/view?id=${publicationId}`, '_blank'); } }}
                          className='cursor-pointer text-base sm:text-lg px-6 sm:px-8 w-full'
                        >
                          View Publication
                        </Button>
                      </div>
                    </div>

                    <Button
                      className='w-full cursor-pointer text-base sm:text-lg py-4 sm:py-6'
                      size="lg"
                      onClick={() => {
                        setIsCompleted(true);
                        window.location.href = `/`;
                      }}
                    >
                      ✓ Finish & Go Home
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
