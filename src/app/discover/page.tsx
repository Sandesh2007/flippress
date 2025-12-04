"use client"
import { OtherUsersPublications, SearchBox } from '@/components';
import { Sparkles } from 'lucide-react';

export default function PublicLandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden py-10 px-2 bg-muted/20">
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass border border-primary/20 mb-8 animate-fade-in shadow-soft">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">Discover amazing content</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-8 animate-slide-up leading-tight">
            <span className="text-gradient-hero">Discover</span>
            <br />
            <span className="text-foreground">Amazing Publications</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Explore a world of interactive publications created by our community of creators and publishers.
          </p>
        </div>
        
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <SearchBox />
        </div>
        
        {/* Publications Grid */}
        <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <OtherUsersPublications 
            title="Featured Publications"
            description="Handpicked publications from our community"
            maxUsers={8}
            maxPublicationsPerUser={4}
          />
        </div>
      </div>
    </div>
  );
}
