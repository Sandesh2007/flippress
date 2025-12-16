'use client'
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { pdfUtils, StoredPdfData } from '@/utils/pdfUtils';

interface PdfFile {
  file: File | null;
  name: string;
  lastModified: number;
}

interface PdfUploadContextType {
  pdf: PdfFile | null;
  storedPdfData: StoredPdfData | null;
  setPdf: (pdf: PdfFile | null) => void;
  clearPdf: () => void;
  storePdfFile: (file: File) => Promise<void>;
  loadStoredPdf: () => Promise<File | null>;
}

const PdfUploadContext = createContext<PdfUploadContextType | undefined>(undefined);

const PDF_STORAGE_KEY = 'flippress_pdf_upload';

export const PdfUploadProvider = ({ children }: { children: ReactNode }) => {
  const [pdf, setPdfState] = useState<PdfFile | null>(null);
  const [storedPdfData, setStoredPdfData] = useState<StoredPdfData | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(PDF_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // File cannot be restored, but metadata can be used to prompt re-selection
        setPdfState(parsed);
      } catch {}
    }

    // Also check for stored PDF data
    const storedPdf = pdfUtils.getStoredPdfData();
    if (storedPdf) {
      setStoredPdfData(storedPdf);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (pdf) {
      // File objects can't be stringified, so only store metadata
      localStorage.setItem(PDF_STORAGE_KEY, JSON.stringify({
        name: pdf.name,
        lastModified: pdf.lastModified,
      }));
    } else {
      localStorage.removeItem(PDF_STORAGE_KEY);
    }
  }, [pdf]);

  const setPdf = (pdf: PdfFile | null) => {
    setPdfState(pdf);
  };

  const clearPdf = () => {
    setPdfState(null);
    setStoredPdfData(null);
    pdfUtils.clearStoredPdfData();
  };

  const storePdfFile = async (file: File): Promise<void> => {
    await pdfUtils.storePdfFile(file);
    setStoredPdfData(pdfUtils.getStoredPdfData());
  };

  const loadStoredPdf = async (): Promise<File | null> => {
    const stored = pdfUtils.getStoredPdfData();
    if (!stored) return null;

    try {
      // Convert stored data URL back to a File object
      const response = await fetch(stored.dataUrl);
      const blob = await response.blob();
      const file = new File([blob], stored.name, {
        type: 'application/pdf',
        lastModified: stored.lastModified
      });
      
      setPdfState({ file, name: stored.name, lastModified: stored.lastModified });
      setStoredPdfData(null);
      return file;
    } catch (error) {
      console.error('Error loading stored PDF:', error);
      return null;
    }
  };

  return (
    <PdfUploadContext.Provider value={{ 
      pdf, 
      storedPdfData, 
      setPdf, 
      clearPdf, 
      storePdfFile, 
      loadStoredPdf 
    }}>
      {children}
    </PdfUploadContext.Provider>
  );
};

export const usePdfUpload = () => {
  const ctx = useContext(PdfUploadContext);
  if (!ctx) throw new Error('usePdfUpload must be used within a PdfUploadProvider');
  return ctx;
}; 