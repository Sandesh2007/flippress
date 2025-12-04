"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import logo from "../../../../../public/logo.svg";
import {
  Home,
  Library,
  FileText,
  Users,
  BarChart3,
  Upload,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-context"
import Image from "next/image";

export default function Sidebar() {
  const [isLibraryOpen, setIsLibraryOpen] = useState(true)
  const { user } = useAuth()
  const isLoggedIn = user !== null
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-72 border-r border-border/20 flex-col glass">
      {/* Header Section */}
      <div className="p-6 border-b border-border/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
            <Image
            src={logo}
            alt="Flippress Logo"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Flippress</h2>
            <p className="text-xs text-muted-foreground">Publisher Dashboard</p>
          </div>
        </div>
        <Link href="/home/create">
          <Button 
            variant="outline" 
            className="w-full cursor-pointer border-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group"
          >
            <Upload className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            Upload Publication
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-4 space-y-2">
        <Link href="/home/publisher">
          <SidebarItem
            icon={<Home className="w-5 h-5" />} 
            label="Dashboard" 
            isActive={pathname === "/home/publisher"}
          />
        </Link>
        
        <div>
          <div
            className="flex items-center px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/30 rounded-xl cursor-pointer transition-all duration-300 group"
            onClick={() => setIsLibraryOpen(!isLibraryOpen)}
          >
            {isLibraryOpen ? 
              <ChevronDown className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" /> : 
              <ChevronRight className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
            }
            <Library className="w-5 h-5 mr-3" />
            <span className="font-medium">My Library</span>
          </div>
          {isLibraryOpen && (
            <div className="ml-8 flex flex-col gap-2 mt-2">
              <Link href="/home/publisher/publications">
                <SidebarItem 
                  icon={<FileText className="w-4 h-4" />} 
                  label="Publications" 
                  isActive={pathname === "/home/publisher/publications"}
                  isSubItem
                />
              </Link>
              <Link href="/home/publisher/social-posts">
                <SidebarItem 
                  icon={<Users className="w-4 h-4" />} 
                  label="Social Posts" 
                  isActive={pathname === "/home/publisher/social-posts"}
                  isSubItem
                />
              </Link>
            </div>
          )}
        </div>

        <Link href="/home/publisher/statistics">
          <SidebarItem 
            icon={<BarChart3 className="w-5 h-5" />} 
            label="Statistics" 
            isActive={pathname === "/home/publisher/statistics"}
          />
        </Link>
      </nav>

      {/* Footer Section */}
      <div className={`p-6 border-t border-border/10 ${isLoggedIn ? "block" : "hidden"}`}>
        <div className="glass outline-1 outline-primary rounded-xl p-4">
          <div className="text-sm text-muted-foreground mb-2">
            Current Plan
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Basic Plan</span>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Upgrade for more features
          </div>
        </div>
      </div>
    </aside>
  )
}

function SidebarItem({ 
  icon, 
  label, 
  isActive = false,
  isSubItem = false
}: { 
  icon: React.ReactNode; 
  label: string; 
  isActive?: boolean;
  isSubItem?: boolean;
}) {
  return (
    <div className={`
      flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 group
      ${isActive 
        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft" 
        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/30"
      }
      ${isSubItem ? "text-sm" : ""}
    `}>
      <div className={`mr-3 ${isSubItem ? "ml-4" : ""}`}>
        {icon}
      </div>
      <span className={`font-medium ${isSubItem ? "text-sm" : ""}`}>
        {label}
      </span>
    </div>
  )
} 