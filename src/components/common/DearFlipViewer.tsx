'use client'
import { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import useDFlip from '../../hooks/useDearFlip';
import { useTheme } from 'next-themes';

// Main component
const DFlipViewer = ({
    pdfFile = null,
    options = {}
}: {
    pdfFile?: File | null;
    options?: any;
}) => {
    const containerRef = useRef(null);
    const [dataUrl, setDataUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const { theme, resolvedTheme } = useTheme();

    useEffect(() => {
        if (pdfFile) {
            setIsLoading(true);
            setIsReady(false);
            setDataUrl(null);

            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setDataUrl(result);
                setIsLoading(false);
                setTimeout(() => setIsReady(true), 300);
            };
            reader.onerror = () => {
                console.error('Error reading PDF file');
                setIsLoading(false);
                setIsReady(false);
                setDataUrl(null);
            };
            reader.readAsDataURL(pdfFile);

            // Cleanup function
            return () => {
                reader.abort();
                setIsReady(false);
                setIsLoading(false);
            };
        } else {
            setDataUrl(null);
            setIsReady(false);
            setIsLoading(false);
        }
    }, [pdfFile]);

    // Get theme-aware colors
    const getThemeColors = () => {
        if (typeof window === 'undefined') return {};

        const isDark = resolvedTheme === 'dark';

        return {
            backgroundColor: isDark
                ? 'rgb(23, 23, 23)'
                : 'rgb(248, 250, 252)',
            controlsColor: isDark
                ? 'rgb(255, 255, 255)'
                : 'rgb(64, 64, 64)',
            textColor: isDark
                ? 'rgb(255, 255, 255)'
                : 'rgb(23, 23, 23)'
        };
    };

    // Merge theme-aware options
    const themeAwareOptions = {
        ...getThemeColors(),
        ...options
    };

    useDFlip(containerRef, (isReady && dataUrl) ? dataUrl : '', themeAwareOptions);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading PDF...</p>
                </div>
            </div>
        );
    }

    if (!dataUrl) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-muted-foreground">No PDF file provided</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="dflip-container"
            data-pdf-url={dataUrl}
        />
    );
};

DFlipViewer.propTypes = {
    pdfFile: PropTypes.object,
    options: PropTypes.object
};

export default DFlipViewer;
