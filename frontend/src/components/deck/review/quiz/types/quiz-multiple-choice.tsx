'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle } from 'lucide-react'
import { speakText } from '@/components/deck/flashcard'

const cleanText = (text: string) => {
  if (!text) return ''
  return text.split('(')[0].trim()
}

interface QuizMultipleChoiceProps {
  vocab: any
  allVocabs: any[]
  mode: 'meaning' | 'reading'
  direction?: 'forward' | 'reverse' // 'forward' (Kanji -> Nghĩa), 'reverse' (Nghĩa -> Kanji)
  onResult: (isCorrect: boolean) => void
}

export function QuizMultipleChoice({ vocab, allVocabs, mode, direction = 'forward', onResult }: QuizMultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)

  useEffect(() => {
    setSelected(null)
    setIsAnswered(false)
  }, [vocab])

  const isReverse = direction === 'reverse'

  // 1. Xác định Câu hỏi và Đáp án đúng dựa theo chiều học
  const questionText = isReverse
      ? (mode === 'meaning' ? vocab.meaning : cleanText(vocab.reading))
      : vocab.word

  const correctAnswer = isReverse
      ? vocab.word
      : (mode === 'meaning' ? vocab.meaning : cleanText(vocab.reading))

  // 2. Tạo danh sách đáp án nhiễu
  const options = useMemo(() => {
    if (!vocab || !allVocabs) return []
    
    const distractors = allVocabs
      .filter(v => v.id !== vocab.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(v => {
        if (isReverse) return v.word // Nếu học ngược, đáp án chọn sẽ là Kanji
        return mode === 'meaning' ? v.meaning : cleanText(v.reading)
      })
    
    while (distractors.length < 3) {
      distractors.push("...")
    }

    const choices = [correctAnswer, ...distractors]
    return choices.sort(() => 0.5 - Math.random())
  }, [vocab, allVocabs, mode, correctAnswer, isReverse])

  const handleSelect = (answer: string) => {
    if (isAnswered) return
    setSelected(answer)
    setIsAnswered(true)
    
    const isCorrect = answer === correctAnswer
    
    // Luôn phát âm từ gốc (Kanji) khi chọn đúng
    if (isCorrect) speakText(vocab.word) 
    
    setTimeout(() => {
        onResult(isCorrect)
    }, 1000)
  }

  // Tiêu đề gợi ý
  let guideText = "Chọn đáp án đúng"
  if (mode === 'meaning') guideText = isReverse ? 'Chọn Kanji tương ứng' : 'Chọn nghĩa đúng'
  if (mode === 'reading') guideText = isReverse ? 'Chọn Kanji tương ứng' : 'Chọn cách đọc đúng'

  // Chỉ hiện Âm Hán Việt nếu đang học xuôi (hiển thị Kanji ở câu hỏi) và có dữ liệu
  const showKanjiMeaning = !isReverse && !!vocab.kanji_meaning

  // XÁC ĐỊNH NỘI DUNG GỢI Ý / ĐÁP ÁN (Hiện ra sau khi user chọn)
  let hintText = ""
  if (mode === 'meaning') {
      // Nếu là quiz Chọn Nghĩa (dù xuôi hay ngược) -> Gợi ý luôn là Cách đọc Hiragana
      hintText = cleanText(vocab.reading)
  } else if (mode === 'reading') {
      // Nếu là quiz Chọn Cách Đọc (dù xuôi hay ngược) -> Gợi ý luôn là Nghĩa
      hintText = vocab.meaning
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-lg mx-auto p-4 animate-in zoom-in-95 duration-300">
      
      {/* CÂU HỎI */}
      <div className="w-full bg-white border-2 border-zinc-100 rounded-3xl p-8 mb-8 shadow-sm flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6 block text-center">
          {guideText}
        </span>
        
        {/* Badge Âm Hán Việt */}
        {showKanjiMeaning && (
           <div className="mb-3">
              <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold border border-zinc-200 px-2.5 py-1 rounded-md bg-zinc-50 shadow-sm">
                {vocab.kanji_meaning}
              </span>
           </div>
        )}

        {/* Text Câu hỏi */}
        {/* 👉 ĐIỀU CHỈNH FONT SIZE TỪ VỰNG Ở ĐÂY 👈 */}
        {/* Thay đổi "text-5xl md:text-6xl" (cho học xuôi) hoặc "text-3xl md:text-4xl" (cho học ngược) tùy ý bạn */}
        <h2 className={cn(
            "font-black text-zinc-900 text-center break-words leading-tight",
            isReverse ? "text-3xl md:text-4xl" : "text-5xl md:text-6xl"
        )}>
          {questionText}
        </h2>
        
        {/* Khối hiển thị Gợi ý sau khi trả lời */}
        {/* 👉 Dùng min-h-[32px] để luôn giữ sẵn 1 khoảng trống, giúp màn hình KHÔNG BỊ GIẬT khi text hiện ra */}
        <div className={cn(
            "mt-4 transition-opacity duration-300 min-h-[32px] flex items-center justify-center",
            isAnswered ? "opacity-100" : "opacity-0"
        )}>
           {/* 👉 ĐIỀU CHỈNH FONT SIZE CỦA PHẦN GỢI Ý Ở ĐÂY (đang là text-lg md:text-xl) 👈 */}
           <p className="text-zinc-500 font-medium text-lg md:text-xl text-center">
               {hintText}
           </p>
        </div>
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
                        "min-h-16 h-auto py-3 justify-start px-6 text-base md:text-lg relative transition-all duration-200 rounded-2xl shadow-sm whitespace-normal",
                        stateClass,
                        isReverse ? "font-bold text-xl md:text-2xl" : "font-medium" // Nhấn mạnh Kanji ở đáp án nếu học ngược
                    )}
                    onClick={() => handleSelect(opt)}
                    disabled={isAnswered || opt === "..."}
                >
                    {/* Badge A, B, C, D */}
                    <span className={cn(
                        "mr-4 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors",
                        isAnswered && isCorrectOption 
                            ? "border-green-600 bg-green-200 text-green-800" 
                            : "border-zinc-200 bg-zinc-100 text-zinc-400"
                    )}>
                        {String.fromCharCode(65 + idx)}
                    </span>
                    
                    <span className="flex-1 text-left leading-snug">{opt}</span>

                    {isAnswered && isCorrectOption && <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600 ml-2 animate-in zoom-in" />}
                    {isAnswered && isSelected && !isCorrectOption && <XCircle className="h-6 w-6 shrink-0 text-red-600 ml-2 animate-in zoom-in" />}
                </Button>
            )
        })}
      </div>
    </div>
  )
}