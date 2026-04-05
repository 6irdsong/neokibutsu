'use client'

export default function ThemeToggle() {
  function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark-mode')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }

  return (
    <button
      id="theme-toggle"
      onClick={toggleDarkMode}
      aria-label="ダークモード切替"
      className="p-2 w-[42px] h-[42px] bg-card-bg text-text border border-border cursor-pointer rounded-full flex items-center justify-center transition-all duration-300 shadow-none max-md:w-[46px] max-md:h-[46px] max-md:p-2"
    >
      <svg className="hidden dark:block w-6 h-6 max-md:w-[22px] max-md:h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
      <svg className="block dark:hidden w-6 h-6 max-md:w-[22px] max-md:h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  )
}
