"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Share2, Plus, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation";

export default function SocialPostsPage() {
  const router = useRouter();

  return (
    <div className="p-6 lg:p-8">
      {/* Hero Section */}
      <section className="glass outline-1 rounded-2xl p-6 lg:p-8 mb-8 backdrop-blur-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center">
            <Share2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Social Posts</h1>
            <p className="text-muted-foreground text-lg">
              Create and manage your social media presence.
            </p>
          </div>
        </div>
        <Button
        onClick={() => {
          router.push('/home/create/social-posts');
        }}
        className="hover:bg-primary/60 text-white border-0 shadow-soft hover:shadow-glow transition-all duration-300">
          <Plus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
          Create New Post
        </Button>
      </section>

      {/* Social Posts Content */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Your Social Posts</h2>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
        <Card className="glass outline-1 shadow-soft backdrop-blur-xl">
          <CardContent className="p-6 lg:p-8">
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-2xl bg-gradient-hero/10 flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">No Social Posts Yet</h3>
              <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                Start creating your first social post to engage with your audience.
              </p>
              <Button 
                variant="outline"
                onClick={() => router.push('/home/create/social-posts')}
                className="border border-primary/30 hover:bg-primary/5 transition-all duration-300 group"
              >
                <Plus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Create Your First Post
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
} 