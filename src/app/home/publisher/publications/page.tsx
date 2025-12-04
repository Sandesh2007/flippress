"use client";
import { PublicationsTab } from "@/components"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PublicationsPage() {
  const router = useRouter();
  return (
    <div className="p-6 lg:p-8">
      {/* Hero Section */}
      <section className="glass outline-1 border-border rounded-2xl p-6 lg:p-8 mb-8 backdrop-blur-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl glass flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Publications</h1>
            <p className="text-muted-foreground text-lg">
              Manage and publish your content with style.
            </p>
          </div>
        </div>
        <Button
        onClick={() => router.push('/home/create')}
        className="text-white outline-1 outline-primary border-0 shadow-soft hover:shadow-glow transition-all duration-300">
          <Plus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
          Create New Publication
        </Button>
      </section>

      {/* Publications Content */}
      <section>
        <div className="flex flex-row items-center justify-between mb-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Your Publications</h2>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
        <Card className="glass outline-1 shadow-soft">
          <CardContent className="p-6 lg:p-8">
            <PublicationsTab/>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
