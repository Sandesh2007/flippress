"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const noLayoutRoutes = ['/auth/register'];
    const isNoLayoutRoute = noLayoutRoutes.includes(pathname);

    const noFooterRoutes = ['/home/publisher', '/auth/register', '/profile', '/home/publisher/publications', '/home/publisher/social-posts', '/home/publisher/statistics'];
    const isNoFooterRoute = noFooterRoutes.includes(pathname);

    return (
        <>
            {!isNoLayoutRoute && (
                <header className="sticky top-0 z-50 border-b-[1px] border-neutral-700 ">
                    <Navbar />
                </header>
            )}
            {children}
            {!isNoFooterRoute && <Footer />}
        </>
    );
}
