"use client";

import * as React from "react";
import logo from "@/../public/logo.svg";
import Image from "next/image";
import {
    Menu,
    X,
    Home,
    Library,
    FileText,
    Users,
    BarChart3,
    Upload,
    ChevronDown,
    ChevronRight,
    Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/themeToggle";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-context";
import { CurrentUserAvatar } from "@/components/common/current-user-avatar";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const { user } = useAuth();
    const homePage = user ? "/home/publisher" : "/";
    const menuRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const router = useRouter();

    // Close mobile menu when screen becomes large
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setMobileOpen(false);
                setIsLibraryOpen(false);
                setIsAnimating(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close mobile menu when navigation occurs
    useEffect(() => {
        setMobileOpen(false);
        setIsLibraryOpen(false);
        setIsAnimating(false);
    }, [pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileOpen]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                handleCloseMenu();
            }
        };

        if (mobileOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [mobileOpen]);

    const handleCloseMenu = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setMobileOpen(false);
            setIsLibraryOpen(false);
            setIsAnimating(false);
        }, 300);
    };

    const handleOpenMenu = () => {
        setMobileOpen(true);
        setIsAnimating(false);
    };

    return (
        <nav className="glass w-full shadow-soft">
            {/* Desktop & Mobile Container */}
            <div className="flex items-center justify-between w-full px-3 sm:px-6 py-3 sm:py-4">
                {/* Left Side: Logo */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <Link href={homePage} className="flex gap-2 sm:gap-3 items-center flex-shrink-0 group">
                        <div className="relative">
                            <Image src={logo} alt="logo" height={36} width={36} className="sm:h-12 sm:w-12 transition-transform duration-300 group-hover:scale-110" priority />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg sm:text-xl text-blue-500">Flippress</span>
                            <span className="text-xs text-muted-foreground hidden sm:block">Digital Publishing</span>
                        </div>
                    </Link>
                </div>

                {/* Desktop Menu */}
                <div className="hidden lg:flex items-center gap-4 xl:gap-6">
                    <div className="flex items-center gap-1">
                        <Button
                            variant={'ghost'}
                            onClick={() => window.location.href = '/discover'}
                            className="px-3 xl:px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium hover:scale-105">
                            <span className="group-hover:text-primary">Discover</span>
                        </Button>
                        <Button
                            variant={'ghost'}
                            className="px-3 xl:px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium hover:scale-105">
                            <Link href="/pricing">
                                <span className="group-hover:text-primary">Pricing</span>
                            </Link>
                        </Button>
                        {user ? (
                            <div className="flex items-center gap-2 xl:gap-3">
                                <Link href="/profile" className="flex items-center gap-2 hover:scale-105 transition-all duration-300 rounded-xl p-2 glass">
                                    <CurrentUserAvatar />
                                </Link>
                            </div>
                        ) : (
                            <>
                                <Button
                                    variant={'ghost'}
                                    className="px-3 xl:px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium hover:scale-105">
                                    <Link href="/auth/register?mode=login">
                                        <span className="group-hover:text-primary">Login</span>
                                    </Link>
                                </Button>
                                <Button asChild className="bg-primary hover:shadow-glow text-white text-sm font-medium px-4 xl:px-6 py-2 rounded-xl transition-all duration-300 hover:scale-105 group">
                                    <Link href="/auth/register?mode=signup">
                                        <Sparkles className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                                        Sign up
                                    </Link>
                                </Button>
                            </>
                        )}
                        <ThemeToggle />
                    </div>
                </div>

                {/* Mobile Controls */}
                <div className="flex items-center gap-2 sm:gap-3 lg:hidden">
                    <ThemeToggle />
                    {user && (
                        <Link href="/profile" className="flex items-center gap-2 p-1.5 sm:p-2 rounded-xl hover:bg-accent transition-all duration-300" aria-label="Go to profile">
                            <CurrentUserAvatar />
                        </Link>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={mobileOpen ? handleCloseMenu : handleOpenMenu}
                        className="hover:bg-accent transition-all duration-300 rounded-xl p-1.5 sm:p-2"
                        aria-label={mobileOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {(mobileOpen || isAnimating) && (
                <div className="fixed inset-0 z-[9999] h-screen">
                    {/* Full Screen Panel */}
                    <div
                        ref={menuRef}
                        className={`fixed inset-0 w-screen h-screen bg-neutral-50 dark:bg-neutral-800 shadow-2xl transform transition-all duration-300 ease-out ${isAnimating ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'
                            }`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border/50 flex-shrink-0">
                            <Link href="/" className="flex gap-2 sm:gap-3 items-center" onClick={handleCloseMenu}>
                                <Image src={logo} alt="logo" height={32} width={32} priority />
                                <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-base sm:text-lg text-blue-500 truncate">Flippress</span>
                                    <span className="text-xs text-muted-foreground">Digital Publishing</span>
                                </div>
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCloseMenu}
                                className="hover:bg-accent transition-all duration-300 rounded-xl"
                                aria-label="Close menu"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Upload Button */}
                        <div className="p-4 sm:p-6 border-b border-border/50 glass flex-shrink-0">
                            <Button
                                variant="outline"
                                className="w-full bg-blue-500 hover:shadow-glow text-white border-blue-500/30 rounded-xl transition-all duration-300 hover:scale-105"
                                onClick={handleCloseMenu}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload PDF
                            </Button>
                        </div>

                        {/* Navigation Menu */}
                        <div className="flex flex-col flex-1 min-h-0">
                            {/* Main content area */}
                            <div className="flex-1 overflow-y-auto">
                                {/* Dashboard Navigation */}
                                {user && (
                                    <div className="px-4 sm:px-6 py-4">
                                        <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Dashboard</h3>
                                        <div className="space-y-2">
                                            <MobileSidebarItem
                                                icon={<Home className="w-5 h-5" />}
                                                label="Home"
                                                href="/"
                                                onClick={handleCloseMenu}
                                            />

                                            <div>
                                                <div
                                                    className="flex items-center px-4 py-3 text-foreground hover:bg-accent/50 rounded-xl cursor-pointer transition-all duration-300"
                                                    onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                                                >
                                                    {isLibraryOpen ? <ChevronDown className="w-4 h-4 mr-3" /> : <ChevronRight className="w-4 h-4 mr-3" />}
                                                    <Library className="w-5 h-5 mr-3" />
                                                    My Library
                                                </div>
                                                {isLibraryOpen && (
                                                    <div className="ml-6 space-y-2 mt-2 transition-all duration-300">
                                                        <MobileSidebarItem
                                                            icon={<FileText className="w-4 h-4" />}
                                                            label="Publications"
                                                            href="/home/publisher/publications"
                                                            onClick={handleCloseMenu}
                                                        />
                                                        <MobileSidebarItem
                                                            icon={<Users className="w-4 h-4" />}
                                                            label="Social Posts"
                                                            href="/home/publisher/social-posts"
                                                            onClick={handleCloseMenu}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <MobileSidebarItem
                                                icon={<BarChart3 className="w-5 h-5" />}
                                                label="Statistics"
                                                href="/home/publisher/statistics"
                                                onClick={handleCloseMenu}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Section */}
                            <div className="w-full px-4 sm:px-6 py-4 self-start sm:py-6 border-t border-border/50 flex-shrink-0">
                                <Button
                                    variant={'ghost'}
                                    onClick={() => {
                                        handleCloseMenu();
                                        window.location.href = '/discover'
                                    }}
                                    className="w-full flex justify-start p-5 rounded-xl transition-all duration-300 text-sm mb-3">
                                    <span>Discover</span>
                                </Button>
                                <Link href="/pricing" className="block px-4 py-3 rounded-xl hover:bg-accent/50 transition-all duration-300 text-sm mb-4" onClick={handleCloseMenu}>
                                    Pricing
                                </Link>
                                {user ? (
                                    <Link href="/profile" className="flex items-center gap-4 px-4 py-3 bg-primary/20 rounded-xl transition-all duration-300" onClick={handleCloseMenu}>
                                        <CurrentUserAvatar />
                                        <span className="font-medium text-sm truncate">{user.username || user.email}</span>
                                    </Link>
                                ) : (
                                    <div className="space-y-3">
                                        <Link href="/auth/register?mode=login" className="block px-4 py-3 rounded-xl hover:bg-accent/50 transition-all duration-300 text-sm" onClick={handleCloseMenu}>
                                            Login
                                        </Link>
                                        <Button asChild className="w-full bg-blue-500 hover:shadow-glow text-white text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105">
                                            <Link href="/auth/register?mode=signup" onClick={handleCloseMenu}>
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Sign up
                                            </Link>
                                        </Button>
                                    </div>
                                )}

                                {/* Plan Info */}
                                {user && (
                                    <div className="mt-4 px-4 py-3 bg-green-500/20 rounded-xl outline outline-green-500">
                                        <div className="text-xs text-black dark:text-white font-medium mb-1">
                                            Current plan: <span className="text-green-800 dark:text-green-300 font-medium">Basic</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

function MobileSidebarItem({
    icon,
    label,
    href,
    onClick
}: {
    icon: React.ReactNode;
    label: string;
    href: string;
    onClick: () => void;
}) {
    return (
        <Link
            href={href}
            className="flex items-center px-4 py-3 text-foreground hover:bg-accent/50 rounded-xl cursor-pointer transition-all duration-300"
            onClick={onClick}
        >
            <span className="mr-3">{icon}</span>
            {label}
        </Link>
    );
}
