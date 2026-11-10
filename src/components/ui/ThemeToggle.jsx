import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Default wajib ke mode terang (warna terang sesuai referensi)
    const savedTheme = localStorage.getItem('iaimu-theme-mode')
    
    // Bersihkan key lama jika ada
    localStorage.removeItem('iaimu-theme')

    if (savedTheme === 'dark') {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
      localStorage.setItem('iaimu-theme-mode', 'light')
    }
  }, [])

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('iaimu-theme-mode', 'light')
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('iaimu-theme-mode', 'dark')
      setIsDark(true)
    }
  }

  return (
    <button 
      onClick={toggleTheme} 
      className="w-9 h-9 rounded-full flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] dark:text-slate-400 dark:hover:text-white hover:bg-[#EBEBED] dark:hover:bg-slate-800 transition-all cursor-pointer"
      title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
      aria-label="Toggle Mode"
      type="button"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
