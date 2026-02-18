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

  useEffect(() => {
    // Tự động focus nhẹ nhàng
    const timer = setTimeout(() => {
        // Kiểm tra nếu đang trên mobile thì có thể cân nhắc không auto-focus quá gắt để tránh nhảy màn hình
        // Nhưng game typing thì nên focus.
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
    // SỬA: justify-start và h-full nhưng có overflow để cuộn nếu cần thiết
    // Bỏ mt-8, pt-4 để tiết kiệm diện tích tối đa phía trên
    <div className="flex flex-col items-center justify-start h-full w-full max-w-md mx-auto p-4 overflow-y-auto no-scrollbar">
      
      {/* Wrapper canh giữa nội dung theo chiều dọc (khi đủ chỗ) */}
      <div className="w-full my-auto flex flex-col gap-4">
        
        {/* CÂU HỎI - Tối ưu diện tích */}
        <div className="w-full bg-white border-2 border-zinc-100 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden shrink-0">
          {/* Giảm size chữ trên mobile từ 5xl xuống 4xl để gọn hơn */}
          <h2 className="text-4xl md:text-7xl font-black text-zinc-900 text-center break-words leading-tight">
            {vocab.word}
          </h2>
          {/* Nghĩa */}
          <p className="text-zinc-400 mt-2 font-medium text-xs text-center line-clamp-2">
              {vocab.meaning}
          </p>
        </div>

        {/* FORM NHẬP LIỆU */}
        <form onSubmit={handleSubmit} className="w-full space-y-4 shrink-0">
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

          {/* HIỂN THỊ ĐÁP ÁN KHI SAI (Compact) */}
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
      
    </div>
  )
}