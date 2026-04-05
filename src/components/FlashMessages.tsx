'use client'

import { useEffect, useRef } from 'react'
import clsx from 'clsx'

interface FlashMessage {
  category: string
  message: string
}

const categoryStyles: Record<string, string> = {
  success: 'bg-success-bg text-[#155724] border-l-success dark:text-[#d4edda] dark:bg-[#1e4620] dark:border-l-[#28a745]',
  danger: 'bg-error-bg text-[#721c24] border-l-error dark:text-[#f8d7da] dark:bg-[#4c1d21] dark:border-l-[#dc3545]',
}

export default function FlashMessages({ messages }: { messages: FlashMessage[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const msgs = containerRef.current.querySelectorAll('[data-flash]')
    msgs.forEach(msg => {
      setTimeout(() => {
        const el = msg as HTMLElement
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease'
        el.style.opacity = '0'
        el.style.transform = 'translateY(-10px)'
        setTimeout(() => el.remove(), 500)
      }, 4000)
    })
  }, [messages])

  if (!messages.length) return null

  return (
    <div id="flash-container" ref={containerRef}>
      {messages.map((msg, i) => (
        <div
          key={i}
          data-flash
          className={clsx(
            'py-[15px] px-5 mb-[25px] rounded-md shadow-sm border-none border-l-[5px] text-[15px] bg-card-bg',
            categoryStyles[msg.category]
          )}
        >
          {msg.message}
        </div>
      ))}
    </div>
  )
}
