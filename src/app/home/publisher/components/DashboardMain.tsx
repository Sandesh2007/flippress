"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import InfoDialog from "./dialog"
import { useRouter } from "next/navigation"
import { PublicationsTab } from '@/components';
import { Upload, FileText, Users, Sparkles, Zap, BookOpen } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Publications")
  const tabs = ["Publications", "Social posts"]

  // Add a handler for file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      router.push('/home/create?from=dashboard');
      return;
    }
  };

  return (
    <main className="flex-1 overflow-auto p-3 sm:p-6 lg:p-8 min-h-screen">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none"></div>
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>

      <div className="relative">
        {/* Upload Section */}
        <section className="rounded-3xl glass border border-border/50 shadow-soft p-6 sm:p-8 mb-8 relative overflow-hidden group hover:shadow-glow transition-all duration-500">
          {/* Card Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Mobile Layout */}
          <div className="block lg:hidden relative">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass outline outline-primary mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Create New Publication</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gradient-hero">Add a New File</h1>
              <p className="text-muted-foreground mb-6">Transform your PDF into an interactive flipbook</p>

              <Button
                className="w-full sm:w-auto glass hover:shadow-glow text-primary font-medium px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 group/btn"
                onClick={() => router.push('/home/create')}
              >
                <Upload className="w-5 h-5 mr-2 group-hover/btn:animate-bounce" />
                Upload a File
              </Button>

              <input
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                ref={el => {
                  // @ts-ignore
                  if (el) window.fileInputRef = el;
                }}
                onChange={handleFileSelect}
              />

              <div className="mt-6">
                <p className="text-sm text-muted-foreground">
                  Supported:&nbsp;
                  <Tooltip>
                    <TooltipTrigger className="underline cursor-pointer text-primary">file types</TooltipTrigger>
                    <TooltipContent className="glass border border-border/50 rounded-xl p-3">
                      <p className="text-sm text-black dark:text-white">.pdf
                         {/* ,.doc, .docx, .pptx */}
                         </p>
                    </TooltipContent>
                  </Tooltip>
                </p>
              </div>

              <div className="flex justify-center mt-6">
                <InfoDialog />
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-glass border border-primary/20 mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Create New Publication</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gradient-hero">Add a New File</h1>
              <p className="text-lg text-muted-foreground mb-6">Transform your PDF into an interactive flipbook with stunning animations</p>

              <Button
                className="w-fit cursor-pointer border border-primary text-white hover:text-black dark:hover:text-white  hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group"

                onClick={() => router.push('/home/create')}
              >
                <Upload className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform  "/>
                Upload a File
              </Button>
            </div>

            <div className="text-center lg:text-right">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-glass border border-primary/20 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Drag & Drop</span>
              </div>

              <h2 className="text-xl font-semibold mb-2">Quick Upload</h2>
              <p className="text-muted-foreground">
                Upload a .pdf or other&nbsp;
                <Tooltip>
                  <TooltipTrigger className="underline cursor-pointer text-primary">file types</TooltipTrigger>
                  <TooltipContent className="bg-gradient-glass border border-border/50 rounded-xl p-3">
                    <p className="text-sm text-primary">.pdf
                       {/* .doc, .docx, .pptx */}
                       </p>
                  </TooltipContent>
                </Tooltip>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <InfoDialog />
            </div>
          </div>
        </section>

        {/* Recent Work Section */}
        <section className="relative">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-gradient-hero">Recent Work</h2>
              <p className="text-muted-foreground">Manage your publications and track performance</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
            {tabs.map((tab) => (
              <Button
                key={tab}
                variant="outline"
                size="sm"
                className={`
                  text-xs sm:text-sm font-medium px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105
                  ${activeTab === tab
                    ? "bg-gradient-hero text-primary border-primary/30 shadow-glow"
                    : "border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground"
                  }
                `}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "Publications" && <FileText className="w-4 h-4 mr-2" />}
                {tab === "Articles" && <BookOpen className="w-4 h-4 mr-2" />}
                {tab === "Social posts" && <Users className="w-4 h-4 mr-2" />}
                {tab}
              </Button>
            ))}
          </div>

          {/* Content Card */}
          <Card className="glass border border-border/50 shadow-soft rounded-3xl overflow-hidden hover:shadow-glow transition-all duration-500">
            <CardContent className="p-6 sm:p-8">
              {activeTab === "Publications" && (
                <PublicationsTab />
              )}
              {activeTab === "Articles" && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gradient-hero">Your Articles</h3>
                  <p className="text-muted-foreground">List of your articles will appear here.</p>
                </div>
              )}
              {activeTab === "Social posts" && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gradient-hero">Your Social Posts</h3>
                  <p className="text-muted-foreground">List of your social posts will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
