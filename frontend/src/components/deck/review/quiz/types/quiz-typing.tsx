'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, Timer } from 'lucide-react'

// Hàm đọc text
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
  const [hasFailed, setHasFailed] = useState(false) // Đánh dấu đã sai lần nào chưa
  const [showAnswer, setShowAnswer] = useState(false) // Trạng thái hiện đáp án trong 5s
  const [countdown, setCountdown] = useState(3) // Đếm ngược
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset khi sang câu mới
  useEffect(() => {
    inputRef.current?.focus()
    setInput('')
    setStatus('idle')
    setHasFailed(false)
    setShowAnswer(false)
  }, [vocab])

  // Logic đếm ngược 5s
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showAnswer) {
      setCountdown(3)
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            // Hết giờ: Ẩn đáp án, reset form để nhập lại
            setShowAnswer(false)
            setStatus('idle')
            setInput('') // Xóa cái sai đi
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
    // Nếu đang đúng, hoặc đang hiện đáp án, hoặc chưa nhập gì -> Chặn submit
    if (status === 'correct' || showAnswer || !input.trim()) return

    // Chuẩn hóa: Bỏ Romaji
    const correctReading = vocab.reading ? vocab.reading.split('(')[0].trim() : ""
    const userInput = input.trim()

    if (userInput === correctReading) {
      // --- ĐÚNG ---
      setStatus('correct')
      speakText(vocab.word)

      // Chuyển câu sau 1.5s
      // Nếu đã từng sai (hasFailed=true) thì kết quả là FALSE để hệ thống SRS biết mà nhắc lại
      setTimeout(() => {
        onResult(!hasFailed)
      }, 1500)

    } else {
      // --- SAI ---
      setStatus('wrong')
      setHasFailed(true)
      setShowAnswer(true) // Kích hoạt chế độ hiện đáp án 5s
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-lg mx-auto p-4 animate-in zoom-in-95 duration-300">
      
      {/* CÂU HỎI */}
      <div className="w-full bg-white border-2 border-zinc-100 rounded-3xl p-8 mb-8 shadow-sm flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
          Nhập cách đọc (Hiragana)
        </span>
        <h2 className="text-6xl md:text-7xl font-black text-zinc-900 text-center break-words leading-tight">
          {vocab.word}
        </h2>
        <p className="text-zinc-300 mt-4 font-medium text-sm text-center">
            {vocab.meaning}
        </p>
      </div>

      {/* INPUT */}
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="relative">
            <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={status === 'correct' || showAnswer} // Khóa khi đang hiện đáp án 5s
                placeholder="Nhập Hiragana..." 
                autoComplete="off" 
                autoCorrect="off" 
                autoCapitalize="off"
                className={cn(
                    "h-16 text-center text-xl font-bold rounded-2xl border-2 transition-all duration-300 shadow-sm",
                    status === 'correct' && "border-green-500 bg-green-50 text-green-900 ring-2 ring-green-200",
                    status === 'wrong' && "border-red-500 bg-red-50 text-red-900 ring-2 ring-red-200",
                    status === 'idle' && "border-zinc-200 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-100"
                )}
            />
            
            {/* Icons trạng thái */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {status === 'correct' && <CheckCircle2 className="h-6 w-6 text-green-600 animate-in zoom-in" />}
                {status === 'wrong' && <XCircle className="h-6 w-6 text-red-600 animate-in zoom-in" />}
            </div>
        </div>

        {/* HIỂN THỊ ĐÁP ÁN ĐÚNG TRONG 5S */}
        <div className={cn(
            "text-center transition-all duration-300 overflow-hidden ease-in-out",
            showAnswer ? "h-24 opacity-100 py-2" : "h-0 opacity-0"
        )}>
            <div className="flex items-center justify-center gap-2 mb-2 text-red-500 animate-pulse font-medium text-sm">
               <Timer className="w-4 h-4" /> Ghi nhớ đáp án trong {countdown}s...
            </div>
            <div className="px-6 py-3 bg-red-50 rounded-xl border border-red-100 inline-block shadow-sm">
                <span className="text-2xl font-black text-red-600 tracking-wider">{vocab.reading}</span>
            </div>
        </div>

        <Button 
            type="submit" 
            disabled={status === 'correct' || showAnswer || !input.trim()}
            className={cn(
                "w-full h-14 rounded-xl text-lg font-bold shadow-lg transition-all",
                status === 'correct' ? "bg-green-600 hover:bg-green-700" : 
                showAnswer ? "bg-zinc-100 text-zinc-400 border border-zinc-200 shadow-none cursor-not-allowed" :
                "bg-zinc-900 hover:bg-zinc-800 hover:translate-y-[-2px]"
            )}
        >
            {status === 'correct' ? "Chính xác!" : showAnswer ? "Đang hiện đáp án..." : "Kiểm tra"}
        </Button>
      </form>
    </div>
  )
}