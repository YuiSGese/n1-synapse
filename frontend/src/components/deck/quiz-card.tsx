'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { speakText } from './flashcard'
import { cn } from '@/lib/utils'

interface QuizCardProps {
  vocab: any
  allVocabs: any[]
  onResult: (isCorrect: boolean) => void
  autoAudio?: boolean
}

export function QuizCard({ vocab, allVocabs, onResult, autoAudio }: QuizCardProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)

  // Tạo bộ câu hỏi (1 đúng + 3 sai)
  const options = useMemo(() => {
    if (!vocab || !allVocabs) return []
    
    // Lấy các từ khác làm đáp án nhiễu
    const distractors = allVocabs
      .filter(v => v.id !== vocab.id)
      .sort(() => 0.5 - Math.random()) // Trộn ngẫu nhiên
      .slice(0, 3) // Lấy 3 từ
    
    // Nếu không đủ từ (ví dụ bài học chỉ có 2 từ), thêm placeholder
    while (distractors.length < 3) {
      distractors.push({ meaning: "..." }) // Placeholder
    }

    // Gộp và trộn lần nữa
    const choices = [vocab, ...distractors]
    return choices.sort(() => 0.5 - Math.random())
  }, [vocab, allVocabs])

  // Phát âm khi hiện câu hỏi
  useEffect(() => {
    if (autoAudio && !isAnswered) {
      const timer = setTimeout(() => speakText(vocab.word), 500)
      return () => clearTimeout(timer)
    }
  }, [vocab, autoAudio, isAnswered])

  const handleSelect = (meaning: string) => {
    if (isAnswered) return
    setSelected(meaning)
    setIsAnswered(true)
    
    const isCorrect = meaning === vocab.meaning
    
    // Âm thanh phản hồi (Optional)
    if (isCorrect) speakText("Seikai") // Hoặc âm thanh "Ting"
    
    // Chuyển câu sau 1.5s
    setTimeout(() => {
        onResult(isCorrect)
        setSelected(null)
        setIsAnswered(false)
    }, 1500)
  }

  return (
    <div className="w-full h-full flex flex-col p-6 bg-white select-none">
      {/* 1. KHU VỰC CÂU HỎI */}
      <div className="flex-1 flex flex-col items-center justify-center mb-6 relative">
        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest absolute top-0">Chọn nghĩa đúng</span>
        
        <h2 className="text-5xl md:text-7xl font-black text-zinc-900 text-center mb-2">
          {vocab.word}
        </h2>
        {/* Chỉ hiện cách đọc sau khi đã trả lời (để gợi ý) hoặc nếu muốn dễ thì hiện luôn */}
        <p className={cn(
            "text-xl text-zinc-400 font-light transition-opacity duration-500",
            isAnswered ? "opacity-100" : "opacity-0"
        )}>
            {vocab.reading}
        </p>
      </div>

      {/* 2. KHU VỰC ĐÁP ÁN */}
      <div className="grid grid-cols-1 gap-3 w-full max-w-md mx-auto">
        {options.map((opt, idx) => {
            const isCorrectOption = opt.id === vocab.id
            const isSelected = selected === opt.meaning
            
            // Logic màu sắc
            let stateClass = "border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 text-zinc-600"
            
            if (isAnswered) {
                if (isCorrectOption) {
                    stateClass = "border-green-500 bg-green-50 text-green-700 font-bold"
                } else if (isSelected && !isCorrectOption) {
                    stateClass = "border-red-500 bg-red-50 text-red-700 opacity-50"
                } else {
                    stateClass = "border-zinc-100 text-zinc-300 opacity-40"
                }
            }

            return (
                <Button
                    key={idx}
                    variant="outline"
                    className={cn(
                        "h-14 justify-start px-4 text-base relative transition-all duration-200",
                        stateClass
                    )}
                    onClick={() => handleSelect(opt.meaning)}
                    disabled={isAnswered || opt.meaning === "..."}
                >
                    {/* A, B, C, D badges */}
                    <span className={cn(
                        "mr-4 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold border",
                        isAnswered && isCorrectOption ? "border-green-600 bg-green-200 text-green-800" : "border-zinc-200 bg-zinc-100 text-zinc-400"
                    )}>
                        {String.fromCharCode(65 + idx)}
                    </span>
                    
                    <span className="truncate flex-1 text-left">{opt.meaning}</span>

                    {/* Icons kết quả */}
                    {isAnswered && isCorrectOption && <CheckCircle2 className="h-5 w-5 text-green-600 ml-2" />}
                    {isAnswered && isSelected && !isCorrectOption && <XCircle className="h-5 w-5 text-red-600 ml-2" />}
                </Button>
            )
        })}
      </div>
    </div>
  )
}