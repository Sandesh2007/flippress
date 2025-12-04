'use client'
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden flex items-center justify-center">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      
      <div className="relative max-w-2xl mx-auto px-4 text-center animate-fade-in">
        <div className="w-24 h-24 bg-gradient-hero rounded-3xl flex items-center justify-center mx-auto mb-8 animate-heartbeat">
          <AlertTriangle className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gradient-hero">
          Oops!
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
          Sorry, something went wrong. We're working to fix this issue.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-hero hover:shadow-glow text-white px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </Button>
          
          <Link href="/">
            <Button 
              variant="outline" 
              className="px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>
        
        <div className="mt-8">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors duration-300">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to homepage</span>
          </Link>
        </div>
      </div>
    </div>
  )
}