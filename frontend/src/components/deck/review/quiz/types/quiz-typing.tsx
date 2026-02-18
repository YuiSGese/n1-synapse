'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Check, X, ArrowRight, Timer } from 'lucide-react'

const speakText = (text: string) => {
  if (typeof window !== 'undefined') {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    window.speechSynthesis.speak(utterance)
  }
}

interface QuizTypingProps {
  vocab: any
  onResult: (isCorrect: boolean) => void
}

export function QuizTyping({ vocab, onResult }: QuizTypingProps) {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'wrong' | 'correct'>('idle')
  const [hasFailed, setHasFailed] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const inputRef = useRef<HTMLInputElement>(null)

  // Tự động focus mỗi khi chuyển từ vựng
  useEffect(() => {
    const timer = setTimeout(() => {
        // Luôn focus vào input để sẵn sàng gõ
        inputRef.current?.focus()
    }, 100)
    
    setInput('')
    setStatus('idle')
    setHasFailed(false)
    setShowAnswer(false)
    return () => clearTimeout(timer)
  }, [vocab])

  // Logic đếm ngược 5s khi sai
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showAnswer) {
      setCountdown(5)
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setShowAnswer(false)
            setStatus('idle')
            setInput('')
            // Focus lại ngay khi hết giờ phạt
            setTimeout(() => inputRef.current?.focus(), 100)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [showAnswer])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (status === 'correct' || showAnswer || !input.trim()) return

    const correctReading = vocab.reading ? vocab.reading.split('(')[0].trim() : ""
    const userInput = input.trim()

    if (userInput === correctReading) {
      setStatus('correct')
      speakText(vocab.word)
      setTimeout(() => {
        onResult(!hasFailed)
      }, 1000)
    } else {
      setStatus('wrong')
      setHasFailed(true)
      setShowAnswer(true)
    }
  }

  // Icon nút bấm thay đổi theo trạng thái
  const ActionIcon = () => {
    if (status === 'correct') return <Check className="w-5 h-5" />
    if (showAnswer) return <span className="font-mono text-xs">{countdown}s</span>
    return <ArrowRight className="w-5 h-5" />
  }

  return (
    // LAYOUT TỐI ƯU CHO MOBILE TYPING
    // Sử dụng Flex column với Spacer để căn chỉnh linh hoạt
    <div className="flex flex-col h-full w-full max-w-md mx-auto p-4 overflow-y-auto no-scrollbar">
      
      {/* Spacer trên: Đẩy nội dung xuống khi có nhiều chỗ */}
      <div className="flex-1" />

      {/* KHỐI NỘI DUNG CHÍNH */}
      <div className="w-full flex flex-col gap-6 shrink-0 transition-all duration-300">
        
        {/* CÂU HỎI */}
        <div className="w-full bg-white border-2 border-zinc-100 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          {/* Kanji */}
          <h2 className="text-4xl md:text-7xl font-black text-zinc-900 text-center break-words leading-tight">
            {vocab.word}
          </h2>
          {/* Nghĩa */}
          <p className="text-zinc-400 mt-2 font-medium text-xs text-center line-clamp-2">
              {vocab.meaning}
          </p>
        </div>

        {/* FORM NHẬP LIỆU */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative group">
              <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                      setInput(e.target.value)
                      if (status === 'wrong') setStatus('idle')
                  }}
                  disabled={status === 'correct' || showAnswer}
                  placeholder="nhập hiragana" 
                  autoComplete="off" 
                  autoCorrect="off" 
                  autoCapitalize="off"
                  className={cn(
                      "h-14 pr-14 pl-6 text-center text-lg font-bold rounded-2xl border-2 transition-all duration-300 shadow-sm placeholder:font-normal placeholder:text-zinc-300",
                      status === 'correct' && "border-green-500 bg-green-50 text-green-900",
                      status === 'wrong' && "border-red-500 bg-red-50 text-red-900",
                      status === 'idle' && "border-zinc-200 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-100"
                  )}
              />
              
              {/* BUTTON NẰM TRONG INPUT */}
              <div className="absolute right-2 top-2 bottom-2">
                  <Button 
                      type="submit"
                      size="icon"
                      disabled={status === 'correct' || showAnswer || !input.trim()}
                      // QUAN TRỌNG: Ngăn chặn mất focus khi click nút
                      onMouseDown={(e) => e.preventDefault()}
                      className={cn(
                          "h-full w-10 rounded-xl transition-all shadow-none",
                          status === 'correct' ? "bg-green-500 hover:bg-green-600 text-white" :
                          status === 'wrong' ? "bg-red-500 hover:bg-red-600 text-white" :
                          "bg-zinc-900 text-white hover:bg-zinc-700"
                      )}
                  >
                      <ActionIcon />
                  </Button>
              </div>
          </div>

          {/* HIỂN THỊ ĐÁP ÁN KHI SAI */}
          <div className={cn(
              "text-center transition-all duration-300 overflow-hidden",
              showAnswer ? "h-auto opacity-100" : "h-0 opacity-0"
          )}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg border border-red-100">
                  <span className="text-[10px] text-red-400 uppercase font-bold">Đáp án:</span>
                  <span className="text-lg font-black text-red-600 tracking-wider">{vocab.reading}</span>
              </div>
          </div>
        </form>
      </div>
      
      {/* Spacer dưới: Đẩy nội dung lên khi bàn phím chiếm chỗ (Spacer này sẽ bị thu nhỏ đầu tiên) */}
      <div className="flex-[2]" /> 
    </div>
  )
}