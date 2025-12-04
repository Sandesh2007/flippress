"use client";

import { Button } from "@/components/";
import { RefreshCw } from "lucide-react";
import { clearAllCaches } from "@/lib/cache-utils";

export function RefreshButton() {
    const handleRefresh = () => {
        clearAllCaches();
        window.location.reload();
    };

    return (
        <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex items-center gap-2 cursor-pointer hover:bg-accent transition-all duration-300 hover:scale-105 rounded-xl"
            onClick={handleRefresh}
            aria-label="Refresh page and clear cache"
        >
            <RefreshCw className="h-4 w-4" />
        </Button>
    );
}
