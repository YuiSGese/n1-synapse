'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle } from 'lucide-react'
import { speakText } from '@/components/deck/flashcard'

// Hàm làm sạch văn bản (Loại bỏ Romaji trong ngoặc)
// Ví dụ: "ほうもん (houmon)" -> "ほうもん"
const cleanText = (text: string) => {
  if (!text) return ''
  return text.split('(')[0].trim()
}

interface QuizMultipleChoiceProps {
  vocab: any
  allVocabs: any[]
  mode: 'meaning' | 'reading'
  onResult: (isCorrect: boolean) => void
}

export function QuizMultipleChoice({ vocab, allVocabs, mode, onResult }: QuizMultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)

  // Reset trạng thái khi chuyển câu hỏi
  useEffect(() => {
    setSelected(null)
    setIsAnswered(false)
  }, [vocab])

  // 1. Xác định Câu hỏi và Đáp án đúng
  const questionText = vocab.word
  
  // Lấy đáp án đúng và làm sạch nếu là chế độ Reading
  const rawCorrectAnswer = mode === 'meaning' ? vocab.meaning : vocab.reading
  const correctAnswer = mode === 'reading' ? cleanText(rawCorrectAnswer) : rawCorrectAnswer

  // 2. Tạo danh sách đáp án
  const options = useMemo(() => {
    if (!vocab || !allVocabs) return []
    
    // Lấy các từ khác làm đáp án nhiễu
    const distractors = allVocabs
      .filter(v => v.id !== vocab.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(v => {
        const val = mode === 'meaning' ? v.meaning : v.reading
        // Làm sạch đáp án nhiễu nếu là chế độ Reading
        return mode === 'reading' ? cleanText(val) : val
      })
    
    // Nếu thiếu, thêm placeholder
    while (distractors.length < 3) {
      distractors.push("...")
    }

    // Gộp và trộn ngẫu nhiên
    const choices = [correctAnswer, ...distractors]
    return choices.sort(() => 0.5 - Math.random())
  }, [vocab, allVocabs, mode, correctAnswer])

  const handleSelect = (answer: string) => {
    if (isAnswered) return
    setSelected(answer)
    setIsAnswered(true)
    
    const isCorrect = answer === correctAnswer
    
    // Phát âm từ vựng khi chọn đúng
    if (isCorrect) {
      speakText(vocab.word) 
    }
    
    // Chuyển câu sau 1s
    setTimeout(() => {
        onResult(isCorrect)
    }, 1000)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-lg mx-auto p-4 animate-in zoom-in-95 duration-300">
      
      {/* CÂU HỎI */}
      <div className="w-full bg-white border-2 border-zinc-100 rounded-3xl p-8 mb-8 shadow-sm flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
          {mode === 'meaning' ? 'Chọn nghĩa đúng' : 'Chọn cách đọc đúng'}
        </span>
        <h2 className="text-6xl md:text-7xl font-black text-zinc-900 text-center break-words leading-tight">
          {questionText}
        </h2>
        
        {/* Hiện cách đọc sau khi trả lời (nếu là mode meaning) */}
        {mode === 'meaning' && isAnswered && (
           <p className="text-zinc-400 mt-2 font-light text-xl animate-in fade-in">{cleanText(vocab.reading)}</p>
        )}
      </div>

      {/* ĐÁP ÁN */}
      <div className="grid grid-cols-1 gap-3 w-full">
        {options.map((opt, idx) => {
            const isCorrectOption = opt === correctAnswer
            const isSelected = selected === opt
            
            let stateClass = "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 text-zinc-600 bg-white"
            
            if (isAnswered) {
                if (isCorrectOption) {
                    stateClass = "border-green-500 bg-green-50 text-green-700 font-bold ring-1 ring-green-500"
                } else if (isSelected && !isCorrectOption) {
                    stateClass = "border-red-500 bg-red-50 text-red-700 opacity-80"
                } else {
                    stateClass = "border-zinc-100 text-zinc-300 opacity-40"
                }
            }

            return (
                <Button
                    key={idx}
                    variant="outline"
                    className={cn(
                        "h-16 justify-start px-6 text-base md:text-lg relative transition-all duration-200 rounded-2xl shadow-sm",
                        stateClass
                    )}
                    onClick={() => handleSelect(opt)}
                    disabled={isAnswered || opt === "..."}
                >
                    {/* Badge A, B, C, D */}
                    <span className={cn(
                        "mr-4 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors",
                        isAnswered && isCorrectOption 
                            ? "border-green-600 bg-green-200 text-green-800" 
                            : "border-zinc-200 bg-zinc-100 text-zinc-400"
                    )}>
                        {String.fromCharCode(65 + idx)}
                    </span>
                    
                    <span className="truncate flex-1 text-left font-medium">{opt}</span>

                    {isAnswered && isCorrectOption && <CheckCircle2 className="h-6 w-6 text-green-600 ml-2 animate-in zoom-in" />}
                    {isAnswered && isSelected && !isCorrectOption && <XCircle className="h-6 w-6 text-red-600 ml-2 animate-in zoom-in" />}
                </Button>
            )
        })}
      </div>
    </div>
  )
}