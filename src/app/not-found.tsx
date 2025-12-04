'use client'
import FuzzyText from '@/specials/fuzzyText';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function NotFound() {
    const pathname = usePathname();

    return (
        <div className="min-h-screen overflow-hidden flex items-center justify-center">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none"></div>
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

            <div className="relative flex flex-col justify-center items-center max-w-4xl mx-auto px-4 py-12 text-center animate-fade-in">
                <div className="mb-8">
                    <FuzzyText
                        fontSize="clamp(3rem, 20vw, 6rem)"
                        fontWeight={900}
                        fontFamily="inherit"
                        enableHover={true}
                        color='gray'
                        baseIntensity={0.18}
                        hoverIntensity={0.5}
                    >
                        404
                    </FuzzyText>
                </div>

                <div className="mb-8">
                    <FuzzyText
                        fontSize="clamp(1.5rem, 5vw, 3rem)"
                        fontWeight={900}
                        fontFamily="inherit"
                        enableHover={true}
                        color='gray'
                        baseIntensity={0.18}
                        hoverIntensity={0.5}
                    >
                        Page Not Found
                    </FuzzyText>
                </div>

                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                    The page you're looking for <code className='bg-neutral-700 w-fit rounded text-white p-1' >{pathname}</code> doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                    <Link href="/" className="w-full sm:w-auto">
                        <Button
                            className="w-full sm:w-auto hover:shadow-glow bg-accent text-white px-8 py-3 rounded-xl transition-all cursor-pointer duration-300 hover:scale-105"
                        >
                            <Home className="w-5 h-5 mr-2" />
                            Go Home
                        </Button>
                    </Link>

                    <Button
                        variant="outline"
                        className="w-full sm:w-auto px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Go Back
                    </Button>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-glass border border-primary/20">
                    <Search className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Try checking the URL or use the navigation menu</span>
                </div>
            </div>
        </div>
    );
}
