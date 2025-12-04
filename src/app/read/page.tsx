import React from 'react'
import { BookOpen, Eye, Share2, Heart } from 'lucide-react'

const Read = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      
      <div className="relative max-w-7xl mx-auto py-20 px-4">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-glass border border-primary/20 mb-8 shadow-soft">
            <BookOpen className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">Reading Experience</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-slide-up">
            <span className="text-gradient-hero">Read</span>
            <br />
            <span className="text-foreground">Publications</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Immerse yourself in beautiful interactive publications and discover amazing content from our community.
          </p>
        </div>

        {/* Placeholder Content */}
        <div className="grid md:grid-cols-3 gap-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="group p-8 rounded-3xl bg-gradient-card border border-border/50 hover:scale-105 card-hover shadow-soft hover:shadow-glow transition-all duration-500">
            <div className="w-20 h-20 rounded-2xl bg-gradient-hero flex items-center justify-center mb-6 group-hover:animate-heartbeat">
              <Eye className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gradient-hero">Interactive Reading</h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Experience publications with smooth page-turning animations and interactive elements.
            </p>
          </div>
          
          <div className="group p-8 rounded-3xl bg-gradient-card border border-border/50 hover:scale-105 card-hover shadow-soft hover:shadow-glow transition-all duration-500">
            <div className="w-20 h-20 rounded-2xl bg-gradient-hero flex items-center justify-center mb-6 group-hover:animate-heartbeat">
              <Share2 className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gradient-hero">Easy Sharing</h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Share your favorite publications with friends and colleagues instantly.
            </p>
          </div>
          
          <div className="group p-8 rounded-3xl bg-gradient-card border border-border/50 hover:scale-105 card-hover shadow-soft hover:shadow-glow transition-all duration-500">
            <div className="w-20 h-20 rounded-2xl bg-gradient-hero flex items-center justify-center mb-6 group-hover:animate-heartbeat">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gradient-hero">Save Favorites</h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Like and save your favorite publications for easy access later.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Read
