'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Check, ArrowRight } from 'lucide-react'

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
  const [countdown, setCountdown] = useState(3)
  
  // THÊM MỚI: Theo dõi trạng thái của bộ gõ IME (đang gõ hay đã chốt chữ)
  const [isComposing, setIsComposing] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const sessionStarted = useRef(false)

  const correctReading = vocab.reading
    ? vocab.reading.split('(')[0].trim()
    : ''

  // 1. Focus input 1 lần duy nhất khi component được mount
  useEffect(() => {
    if (!sessionStarted.current) {
      sessionStarted.current = true
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [])

  // 2. Reset state khi sang từ mới
  useEffect(() => {
    setInput('')
    setStatus('idle')
    setShowAnswer(false)
    setHasFailed(false) // Nên reset cả trạng thái fail cho từ mới
    setIsComposing(false) // Reset trạng thái IME
    
    // Đánh thức lại con trỏ nhấp nháy trên iOS sau khi đã xóa sạch chữ cũ.
    // Nếu bàn phím đang mở sẵn, thao tác này không làm giật màn hình mà giúp con trỏ (caret) không bị kẹt.
    if (document.activeElement !== inputRef.current) {
      inputRef.current?.focus()
    }
  }, [vocab])

  // 3. Auto submit khi gõ đúng
  useEffect(() => {
    if (
      input &&
      status === 'idle' &&
      !showAnswer &&
      input === correctReading &&
      !isComposing // QUAN TRỌNG: Chỉ auto-submit khi người dùng đã chốt chữ (không còn gạch chân dưới chữ)
    ) {
      handleSubmit()
    }
    // Cần thêm isComposing và các dependency khác để theo dõi sát sao
  }, [input, isComposing, status, showAnswer, correctReading])

  // 4. Countdown khi sai
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (showAnswer) {
      speakText(vocab.word)
      setCountdown(3)

      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setShowAnswer(false)
            setStatus('idle')
            setInput('')
            // Focus lại sau khi hết thời gian đếm ngược
            inputRef.current?.focus()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearInterval(timer)
  }, [showAnswer, vocab.word])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()

    if (status === 'correct' || showAnswer || !input.trim()) return

    if (input.trim() === correctReading) {
      setStatus('correct')
      speakText(vocab.word)

      setTimeout(() => {
        onResult(!hasFailed)
      }, 700)
    } else {
      setStatus('wrong')
      setHasFailed(true)
      setShowAnswer(true)
    }
  }

  const ActionIcon = () => {
    if (status === 'correct') return <Check className="w-5 h-5" />
    if (showAnswer) return <span className="font-mono text-xs">{countdown}s</span>
    return <ArrowRight className="w-5 h-5" />
  }

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto p-4 overflow-y-auto no-scrollbar">
      <div className="h-2 md:h-12 shrink-0 transition-all" />

      <div className="w-full flex flex-col gap-4 md:gap-6 shrink-0 transition-all duration-300">
        <div className="w-full bg-white border-2 border-zinc-100 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          <h2 className="text-4xl md:text-7xl font-black text-zinc-900 text-center break-words leading-tight">
            {vocab.word}
          </h2>
          <p className="text-zinc-400 mt-2 font-medium text-xs text-center line-clamp-2">
            {vocab.meaning}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative group">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => {
                if (status === 'correct' || showAnswer) return
                setInput(e.target.value)
                if (status === 'wrong') setStatus('idle')
              }}
              // THÊM MỚI: Bắt sự kiện bắt đầu và kết thúc gõ IME để chặn auto-submit sai thời điểm
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}

              placeholder="nhập hiragana"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              
              className={cn(
                "h-14 pr-14 pl-6 text-center text-lg font-bold rounded-2xl border-2 transition-all duration-300 shadow-sm placeholder:font-normal placeholder:text-zinc-300",
                status === 'correct' && "border-green-500 bg-green-50 text-green-900",
                status === 'wrong' && "border-red-500 bg-red-50 text-red-900 animate-shake",
                status === 'idle' && "border-zinc-200 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-100",
                showAnswer && "opacity-80"
              )}
            />

            <div className="absolute right-2 top-2 bottom-2">
              <Button
                type="submit"
                size="icon"
                disabled={showAnswer || !input.trim()}
                // QUAN TRỌNG: Giữ nguyên để tránh mất focus khi user cố tình bấm nút
                onMouseDown={(e) => e.preventDefault()}
                className={cn(
                  "h-full w-10 rounded-xl transition-all shadow-none",
                  status === 'correct'
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : status === 'wrong'
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-zinc-900 text-white hover:bg-zinc-700"
                )}
              >
                <ActionIcon />
              </Button>
            </div>
          </div>

          <div
            className={cn(
              "text-center transition-all duration-300 overflow-hidden",
              showAnswer ? "h-auto opacity-100" : "h-0 opacity-0"
            )}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg border border-red-100">
              <span className="text-[10px] text-red-400 uppercase font-bold">
                Đáp án:
              </span>
              <span className="text-lg font-black text-red-600 tracking-wider">
                {vocab.reading}
              </span>
            </div>
          </div>
        </form>
      </div>

      <div className="flex-1 min-h-[20px]" />
    </div>
  )
}