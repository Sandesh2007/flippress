"use client"
import React, { useEffect } from "react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"


export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    return (
        <Button
            className="outline-none"
            variant="ghost" size="lg" onClick={() => {
                setTheme(theme === "dark" ? "light" : "dark")
            }} >
            {/* <SunMoon size={32} /> */}
            {theme === "dark" ? <Sun /> : <Moon />}
        </Button>

    )
}
