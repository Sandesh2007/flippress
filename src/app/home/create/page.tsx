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
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20 py-8 px-4 lg:px-8">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header with Stepper */}
        <div className="glass shadow-xl rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((label, idx) => (
              <div key={label} className="flex-1 flex flex-col items-center relative">
                {idx > 0 && (
                  <div className={`absolute right-1/2 top-4 w-full h-0.5 -z-10 transition-colors duration-300 ${idx <= step ? 'bg-primary' : 'bg-border'}`} />
                )}
                <div className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${idx === step ? 'bg-primary text-primary-foreground border-primary scale-110 shadow-lg' : 'bg-muted text-muted-foreground border-border'} ${idx < step ? 'bg-primary/80 text-primary-foreground border-primary' : ''}`}>
                  {idx < step ? <CheckCircle className="w-6 h-6" /> : <span className="text-lg font-bold">{idx + 1}</span>}
                </div>
                <span className={`mt-3 text-sm font-semibold ${idx === step ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="glass shadow-xl rounded-2xl overflow-hidden">
          <div className="p-8 lg:p-12">
            {!pdf && step > 0 && (
              <div className="text-destructive text-center p-6 font-bold bg-red-50 border-2 border-red-200 rounded-xl mb-8 text-lg">
                You must upload a PDF before continuing. Please upload your file to proceed.
              </div>
            )}
            {error && <div className="text-destructive mb-6 text-center text-lg font-semibold">{error}</div>}

            {step === 0 && (
              <div className="max-w-5xl mx-auto">
                <div
                  {...getRootProps()}
                  className={`relative overflow-hidden rounded-3xl p-16 text-center cursor-pointer transition-all duration-500 glass border-2 border-dashed shadow-soft hover:shadow-upload focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[500px] flex flex-col items-center justify-center
                    ${isDragActive && !isDragReject ? 'border-primary bg-primary/5 shadow-glow scale-[1.02]' : ''}
                    ${isDragReject ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : ''}
                    ${!isDragActive && !isDragReject ? 'border-primary/30 hover:border-primary/60 hover:scale-[1.01]' : ''}
                  `}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload file by dragging and dropping or clicking to browse"
                >
                  <input {...getInputProps()} />
                  <div className="relative">
                    <div className={`flex items-center justify-center w-32 h-32 mx-auto mb-8 rounded-3xl transition-all duration-300 ${isDragReject ? 'bg-red-100 dark:bg-red-900/30 animate-wiggle' : 'bg-gradient-hero shadow-glow'}`}>
                      <FileText className={`w-16 h-16 transition-colors ${isDragReject ? 'text-red-600 dark:text-red-400' : 'text-primary'}`} />
                    </div>
                    <h3 className="text-4xl font-bold text-foreground mb-6">
                      {isDragActive && !isDragReject
                        ? 'Drop your file here'
                        : isDragReject
                          ? 'Invalid file type'
                          : 'Drag & Drop your file'}
                    </h3>
                    <p className="text-muted-foreground mb-8 text-xl">
                      {isDragActive && !isDragReject
                        ? 'Release to upload your file'
                        : isDragReject
                          ? 'Please select a supported file type'
                          : 'Drag your file here, or click to browse'}
                    </p>
                    <div className="text-base text-muted-foreground mb-10 space-y-2">
                      <p className="font-medium">Maximum file size: {MAX_FILE_SIZE / 1024 / 1024}MB</p>
                      <p>Supported formats: PDF, EPUB</p>
                    </div>
                    <Button
                      type="button"
                      className="hover:shadow-glow text-white shadow-soft hover:scale-105 px-10 py-6 text-xl font-semibold"
                      size="lg"
                    >
                      <UploadCloud className="w-6 h-6 mr-3" />
                      Browse Files
                    </Button>
                  </div>
                </div>

                {pdf && (
                  <div className="mt-10 w-full max-w-2xl mx-auto">
                    <div className="glass rounded-2xl p-8 border border-border">
                      <div className="flex items-center gap-6 mb-6">
                        {thumbnailDataUrl && (
                          <div className="w-32 h-40 rounded-xl border-2 border-border overflow-hidden bg-white shadow-md flex-shrink-0">
                            <img
                              src={thumbnailDataUrl}
                              alt="PDF Thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-bold text-2xl text-primary mb-2">{pdf.name}</div>
                          <div className="text-base text-muted-foreground">{(pdf.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-center">
                        <Button variant="outline" size="lg" onClick={() => handlePdfChange(null)} className="cursor-pointer text-base px-6">Remove File</Button>
                        <Button variant="outline" size="lg" onClick={() => pdfInputRef.current?.click()} className="cursor-pointer text-base px-6">Choose Different File</Button>
                      </div>
                      <Button onClick={handleNext} className="w-full mt-6 cursor-pointer text-lg py-6" size="lg">Continue to Details →</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-10">Publication Details</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-8">
                    <div>
                      <label className="block text-lg font-semibold mb-4 text-foreground">Title</label>
                      <Input
                        placeholder="Enter a compelling title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full glass border-2 rounded-xl p-4 focus:border-primary/50 h-14 text-lg font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-lg font-semibold mb-4 text-foreground">Description</label>
                      <Textarea
                        placeholder="Describe your publication in detail"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="glass shadow-soft focus:shadow-glow focus:border-primary/50 transition-all duration-300 min-h-[200px] resize-none text-base p-4"
                      />
                    </div>
                  </div>
                  <div className="glass rounded-xl p-6 border border-border flex flex-col justify-center">
                    <h3 className="text-xl font-semibold mb-4">Preview</h3>
                    {thumbnailDataUrl && (
                      <div className="mb-4 flex justify-center">
                        <div className="w-48 h-64 rounded-xl border-2 border-border overflow-hidden bg-white shadow-md">
                          <img
                            src={thumbnailDataUrl}
                            alt="PDF Thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="font-bold text-xl text-foreground mb-2">{title || 'Untitled'}</div>
                      <div className="text-muted-foreground text-sm">{description || 'No description yet'}</div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 justify-between mt-10">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    size="lg"
                    className='cursor-pointer border-border/50 hover:border-border hover:bg-muted/50 transition-all duration-300 text-lg px-8'
                  >
                    ← Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!title || !description}
                    size="lg"
                    className='cursor-pointer hover:shadow-glow text-white shadow-soft hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg px-8'
                  >
                    Next →
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-8">Preview Your Publication</h2>
                {pdf ? (
                  <div className="border-2 rounded-2xl overflow-hidden w-full h-full min-h-[700px] shadow-lg">
                    {!isViewerReady ? (
                      <div className="flex items-center justify-center h-96">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xl">Initializing PDF viewer...</span>
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
                  <p className="text-muted-foreground text-center text-xl">No PDF selected for preview.</p>
                )}
                <div className="flex gap-4 justify-between mt-8">
                  <Button variant="secondary" onClick={handleBack} size="lg" className='cursor-pointer text-lg px-8'>← Back</Button>
                  <Button onClick={handleNext} disabled={!pdf} size="lg" className="cursor-pointer text-lg px-8">Next →</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-10">Review & Publish</h2>
                <div className="glass rounded-2xl p-10 border border-border">
                  <div className="flex items-start gap-8 mb-8">
                    <div className="w-48 h-64 flex items-center justify-center rounded-2xl bg-muted border-2 border-border overflow-hidden flex-shrink-0">
                      {thumbnailDataUrl ? (
                        <img
                          src={thumbnailDataUrl}
                          alt="PDF Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-20 h-20 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-6">
                      <div>
                        <Label className="text-base font-semibold text-muted-foreground mb-2 block">Title</Label>
                        <div id='title' className="font-bold text-3xl text-foreground">{title}</div>
                      </div>

                      <div>
                        <Label className="text-base font-semibold text-muted-foreground mb-2 block">Description</Label>
                        <div id='description' className="text-foreground text-lg leading-relaxed">{description}</div>
                      </div>

                      <div className="flex items-center gap-3 border-2 border-border rounded-xl p-4 bg-muted">
                        <FileText className="w-6 h-6 text-primary" />
                        <span className="text-base font-semibold">{pdf?.name}</span>
                        <span className="text-sm text-muted-foreground ml-auto">{pdf && (pdf.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      {thumbnailDataUrl && (
                        <div className="flex items-center gap-3 border-2 border-green-200 rounded-xl p-4 bg-green-50">
                          <ImageIcon className="w-6 h-6 text-green-600" />
                          <span className="text-green-600 text-base font-semibold">Thumbnail generated successfully</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-4 justify-between">
                    <Button variant="secondary" onClick={handleBack} disabled={uploading} size="lg" className='cursor-pointer text-lg px-8'>← Back</Button>
                    <Button onClick={() => handlePublish()} disabled={uploading || !title.trim() || !description.trim()} size="lg" className={uploading ? 'opacity-75 text-lg px-8' : 'cursor-pointer text-lg px-8'}>
                      {uploading ? (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-white text-white border-t-transparent rounded-full animate-spin"></div>
                          Publishing...
                        </div>
                      ) : (
                        'Publish Now'
                      )}
                    </Button>
                  </div>
                  
                  {uploading && (
                    <div className="mt-8 p-6 bg-muted rounded-xl border border-border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
                        <span className="text-base font-semibold text-muted-foreground">Uploading to cloud storage...</span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {pdf && `File size: ${(pdf.size / (1024 * 1024)).toFixed(1)} MB`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {pdf && pdf.size > 10 * 1024 * 1024 ?
                          `Large file detected. This may take several minutes. Please don't close this page.` :
                          `This may take a few moments. Please don't close this page.`
                        }
                      </div>
                    </div>
                  )}
                  
                  {error && !uploading && (
                    <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5 text-xl">⚠️</div>
                        <div className="flex-1">
                          <p className="text-red-800 dark:text-red-200 text-base font-semibold mb-2">
                            Upload Failed
                          </p>
                          <p className="text-red-700 dark:text-red-300 text-base mb-4">
                            {error}
                          </p>
                          <div className="flex gap-3">
                            <Button
                              size="lg"
                              onClick={() => handlePublish(uploadRetries + 1)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Retry Upload
                            </Button>
                            <Button
                              size="lg"
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
              </div>
            )}

            {step === 4 && published && (
              <div className="max-w-4xl mx-auto">
                <div className="glass rounded-2xl p-12 text-center border border-border">
                  <div className="flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/20 mb-6 mx-auto shadow-lg">
                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-3xl font-bold text-green-700 dark:text-green-400 mb-8">🎉 Publication Created Successfully!</div>
                  
                  <div className="w-full max-w-2xl mx-auto space-y-6">
                    <div className="glass rounded-xl p-6 border border-border">
                      <div className="text-muted-foreground text-base mb-4 font-semibold">Share your publication:</div>
                      <div className="flex flex-col gap-4 items-center justify-center">
                        <div className="w-full">
                          <div
                            onClick={() => { if (publicationId) {navigator.clipboard.writeText(`flippress.vercel.app/view?id=${publicationId}`); toastify.success("Copied to clipboard!");}}}
                            className="bg-muted border-2 border-border rounded-xl cursor-pointer p-6 hover:bg-muted/80 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02]"
                          >
                            <div className="text-xl font-bold text-foreground mb-2">{title}</div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {publicationId ? `flippress.vercel.app/view?id=${publicationId}` : 'Loading...'}
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="lg" 
                          variant="outline" 
                          onClick={() => { if (publicationId) {window.open(`/view?id=${publicationId}`, '_blank');}}} 
                          className='cursor-pointer text-lg px-8 w-full'
                        >
                          View Publication
                        </Button>
                      </div>
                    </div>
                    
                    <Button
                      className='w-full cursor-pointer text-lg py-6'
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
