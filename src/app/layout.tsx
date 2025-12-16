import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/layout/themeProvider";
import { NetworkStatus } from "@/specials/networkStatus";
import { Toaster } from "react-hot-toast";
import { GradientBackground } from "@/components/common/gradiantBackground";
import ClientLayout from "@/layout/clientLayout";
import { AuthProvider } from "@/components/auth/auth-context";
import { PdfUploadProvider, PublicationsProvider } from "@/components";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Book publishing Website",
  description: "Create stunning digital books",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressContentEditableWarning>
      <body
        className={`${poppins.className} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute={"class"}
            enableSystem
          >
            <GradientBackground>
              <ClientLayout>
                <PdfUploadProvider>

                  <PublicationsProvider>


                    <Toaster
                      position="bottom-right"
                    />
                    <NetworkStatus />
                    {children}
                  </PublicationsProvider>
                </PdfUploadProvider>
              </ClientLayout>
            </GradientBackground>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
