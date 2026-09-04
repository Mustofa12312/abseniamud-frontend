import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "./Button"

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check initial preference from localStorage or OS setting
    const savedTheme = localStorage.getItem('iaimu-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('iaimu-theme', 'light')
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('iaimu-theme', 'dark')
      setIsDark(true)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme} 
      className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </Button>
  )
}
