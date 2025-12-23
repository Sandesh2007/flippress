"use client";

// import { FileUpload } from "@/components/sections/file-upload";
import { useAuth } from "@/components/auth/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  Zap,
  Users,
  Star,
  Shield,
  Globe,
} from "lucide-react";

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group p-8 rounded-3xl glass border border-border hover:scale-105 card-hover shadow-soft hover:shadow-glow transition-all duration-500">
      <div className="w-20 h-20 rounded-2xl bg-gradient-hero flex items-center justify-center mb-6 group-hover:animate-heartbeat">
        {icon}
      </div>
      <h3 className="text-2xl font-semibold mb-4 text-gradient-hero">
        {title}
      </h3>
      <p className="text-muted-foreground leading-relaxed text-lg">
        {description}
      </p>
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/home/publisher");
    }
  }, [user, loading, router]);

  if (!loading && user) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mb-4"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-primary/30"></div>
        </div>
        <p className="text-muted-foreground animate-pulse-slow">
          Redirecting to your dashboard<span className="loading-dots"></span>
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="relative max-w-7xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass border border-primary/20 mb-8 animate-fade-in shadow-soft">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">
              Transform your PDFs into interactive experiences
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold mb-8 animate-slide-up leading-tight text-neutral-900 dark:text-neutral-50">
            <span className="text-gradient-hero">Transform PDFs</span>
            <br />
            <span className="text-foreground">into Interactive</span>
            <br />
            <span className="text-neutral-900 dark:text-neutral-50">
              Flipbooks
            </span>
          </h1>

          <p
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Upload your PDF documents and convert them into beautiful,
            interactive flipbooks that captivate your audience with smooth
            animations and a modern reading experience.
          </p>

          {/* Stats */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto mb-12 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            {[
              { value: "100+", label: "Happy Users" },
              { value: "50+", label: "PDFs Converted" },
              { value: "99.9%", label: "Uptime" },
              { value: "24/7", label: "Support" },
            ].map((stat, i) => (
              <div
                key={i}
                className="group text-center p-6 rounded-2xl glass border border-border/50 hover:scale-105 card-hover"
              >
                <div className="text-4xl font-bold text-gradient mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload */}
        <div className="animate-scale-in" style={{ animationDelay: "0.6s" }}>
          {/* <FileUpload /> */}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 `bg-linear-to- from-transparent to-muted/20 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass border border-primary/20 mb-8">
              <Star className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Why Choose Flippress?
              </span>
            </div>

            <h2 className="text-5xl md:text-6xl font-bold mb-8 text-gradient-hero">
              Experience the Future of
              <br />
              Digital Publishing
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Our advanced features transform static documents into vibrant,
              interactive experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BookOpen className="w-10 h-10 text-primary" />}
              title="Interactive Flipbooks"
              description="Bring your PDFs to life with smooth page-turn animations, clickable links for a richer reading experience."
            />
            <FeatureCard
              icon={<Zap className="w-10 h-10 text-primary" />}
              title="Responsive"
              description="Enjoy a viewing experience that adapts seamlessly to any device—desktop, tablet, or phone—without losing quality or usability."
            />
            <FeatureCard
              icon={<Users className="w-10 h-10 text-primary" />}
              title="Discover"
              description="Browse and explore flipbooks shared by other creators, get inspired, and see what’s trending in the community."
            />
          </div>

          {/* Additional Features */}
          <div className="grid md:grid-cols-2 gap-8 mt-16">
            {[
              {
                icon: <Shield className="w-6 h-6 text-primary" />,
                title: "Secure & Private",
                desc: "Your documents are encrypted and stored securely.",
              },
              {
                icon: <Globe className="w-6 h-6 text-primary" />,
                title: "Global Access",
                desc: "Open and share your flipbooks from anywhere in the world.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl glass outline outline-primary/50 hover:scale-105 card-hover"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">{item.title}</h4>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*<SupportedFormats />*/}
      {/* <ConversionInfo />
      <Testimonials /> */}
    </main>
  );
}
