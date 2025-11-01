import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Share2, FileText, Image, Sparkles, Zap, TrendingUp, Heart } from "lucide-react";

const conTypes = [
  {
    title: "Flipbook",
    description: "Interactive page-turning experience with stunning animations and multimedia support",
    icon: BookOpen,
    color: "from-blue-500/20 to-blue-600/20",
    borderColor: "border-blue-200/50",
    badge: "Most Popular",
    features: ["Page turning effects", "Optimized", "Mobile responsive"]
  },
  {
    title: "Social Post",
    description: "Optimized for social media sharing with engaging previews and viral potential",
    icon: Share2,
    wip: true,
    color: "from-green-500/20 to-green-600/20",
    borderColor: "border-green-200/50",
    features: ["Social media optimized", "Viral sharing", "Engagement tracking"]
  },
  {
    title: "GIF",
    description: "Animated preview for maximum engagement and social media impact",
    icon: Image,
    wip: true,
    color: "from-orange-500/20 to-orange-600/20",
    borderColor: "border-orange-200/50",
    features: ["Animated previews", "Social media ready", "High engagement"]
  }
];

export const ConversionInfo = () => {
  return (
    <section className="py-20 px-4 bg-muted/20">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-500/20 mb-6 animate-fade-in">
            <Zap className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-500">Multiple output formats</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-blue-500">
            Turn your files into a...
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Choose from multiple output formats to suit your content strategy and audience. Each format is optimized for maximum engagement and impact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {conTypes.map((type, index) => (
            <Card
              key={index}
              className={`group glass border ${type.borderColor}  hover:scale-105 card-hover relative overflow-hidden animate-fade-in`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Background Color */}
              <div className={`absolute inset-0 ${type.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

              {type.badge && (
                <Badge className="absolute top-4 right-4 bg-blue-500 text-white border-0 z-10">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {type.badge}
                </Badge>
              )}
              {type.wip && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-bl-lg">
                  <FileText className="inline-block mr-1" />
                  <span className="font-semibold">Upcoming</span>
                </div>
              )}

              <CardContent className="p-8 text-center relative z-10">
                <div className="mb-6 flex justify-center">
                  <div className="h-20 w-20 rounded-2xl bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-glow">
                    <type.icon className="h-10 w-10 text-white" />
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-4 text-foreground">{type.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  {type.description}
                </p>

                {/* Features */}
                <div className="space-y-2">
                  {type.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60"></div>
                      {feature}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};