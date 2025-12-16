'use client';

import React from 'react';
import { CheckCircle, Sparkles, Zap, Shield, Users, Star } from 'lucide-react';

const features = [
  'Upload and publish PDFs',
  'Public sharing link',
  'Responsive viewer',
  'Unlimited publications',
  'Basic analytics (views only)',
];

const Pricing = () => {
  return (
    
      <div className="min-h-screen relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

        <div className="relative max-w-6xl mx-auto py-20 px-4">
          {/* Header Section */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Simple, transparent pricing</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-slide-up">
              <span className="text-gradient-hero">Choose Your</span>
              <br />
              <span className="text-foreground">Perfect Plan</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Get started for free — no credit card required. Upgrade anytime as your needs grow.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="flex justify-center animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="w-full max-w-md rounded-3xl border-2 border-border shadow-soft glass p-8 relative overflow-hidden group hover:shadow-glow transition-all duration-500 hover:scale-105">
              {/* Card Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Plan Badge */}
              <div className="relative flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gradient-hero">Basic Plan</h2>
                    <p className="text-sm text-muted-foreground">Perfect for individuals</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Active</span>
                </div>
              </div>

              {/* Price */}
              <div className="relative mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gradient-hero">Free</span>
                  <span className="text-muted-foreground">forever</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">No hidden fees, no surprises</p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3 group/feature">
                    <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mt-0.5 group-hover/feature:scale-110 transition-transform duration-200">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                    <span className="text-sm text-muted-foreground group-hover/feature:text-foreground transition-colors duration-200">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Additional Info */}
              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                  Need more features? <span className="text-primary hover:underline cursor-pointer">Contact us</span>
                </p>
              </div>
            </div>
          </div>

          {/* Features Comparison */}
          <div className="mt-20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-3xl font-bold text-center mb-12 text-gradient-hero">
              Everything You Need
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="group p-6 rounded-2xl glass outline-2 hover:scale-105 card-hover">
                <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-4 group-hover:animate-heartbeat">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Fast</h3>
                <p className="text-sm text-muted-foreground">
                  Convert your PDFs in seconds with our optimized processing engine.
                </p>
              </div>

              <div className="group p-6 rounded-2xl glass outline-2 hover:scale-105 card-hover">
                <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-4 group-hover:animate-heartbeat">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
                <p className="text-sm text-muted-foreground">
                  Your documents are encrypted and secure. We never access your content.
                </p>
              </div>

              <div className="group p-6 rounded-2xl glass outline-2 hover:scale-105 card-hover">
                <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-4 group-hover:animate-heartbeat">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Easy Sharing</h3>
                <p className="text-sm text-muted-foreground">
                  Share your flipbooks with anyone using simple, secure links.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Pricing;
