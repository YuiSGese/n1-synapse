'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { QuizMultipleChoice } from './types/quiz-multiple-choice'
import { QuizMatching } from './types/quiz-matching'
import { QuizTyping } from './types/quiz-typing'
import { QuizMode } from './quiz-setup'
import { Trophy, RefreshCcw, ArrowLeft } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { calculateSRS, SRSData } from '@/lib/srs'

// ĐÃ FIX LỖI: Bổ sung định nghĩa QuestionItem
type QuestionItem = {
  type: 'meaning' | 'reading' | 'typing' | 'matching'
  data: any
}

interface QuizSessionProps {
  vocabList: any[]
  mode: QuizMode
  options?: any // <--- NHẬN PROPS LỰA CHỌN CHIỀU HỌC
  onExit: () => void
}

export function QuizSession({ vocabList, mode, options, onExit }: QuizSessionProps) {
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [totalItems, setTotalItems] = useState(0) 
  const [isFinished, setIsFinished] = useState(false)
  const supabase = createClient()

  // 1. CHUẨN BỊ DỮ LIỆU CÂU HỎI
  useEffect(() => {
    const shuffled = [...vocabList].sort(() => Math.random() - 0.5)
    let newQuestions: QuestionItem[] = []
    let total = 0

    if (mode === 'mixed') {
      // --- LOGIC MIXED MODE ---
      let i = 0
      while (i < shuffled.length) {
        const remaining = shuffled.length - i
        
        // Danh sách các loại bài có thể ra
        const possibleTypes: ('meaning' | 'reading' | 'typing' | 'matching')[] = ['meaning', 'reading', 'typing']
        if (remaining >= 4) possibleTypes.push('matching')

        // Random chọn loại bài
        const randomType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)]

        if (randomType === 'matching') {
          // Lấy 4-6 từ cho game nối
          const batchSize = Math.min(remaining, 6)
          const batch = shuffled.slice(i, i + batchSize)
          newQuestions.push({ type: 'matching', data: batch })
          total += batchSize
          i += batchSize
        } else {
          // Các dạng bài đơn lẻ
          newQuestions.push({ type: randomType, data: shuffled[i] })
          total += 1
          i += 1
        }
      }
    } else if (mode === 'matching') {
      // --- LOGIC MATCHING ONLY ---
      const chunkSize = 6
      for (let i = 0; i < shuffled.length; i += chunkSize) {
        newQuestions.push({ type: 'matching', data: shuffled.slice(i, i + chunkSize) })
      }
      total = shuffled.length
    } else {
      // --- LOGIC SINGLE MODES (Meaning, Reading, Typing) ---
      const singleMode = mode as 'meaning' | 'reading' | 'typing'
      newQuestions = shuffled.map(v => ({ type: singleMode, data: v }))
      total = shuffled.length
    }
    
    setQuestions(newQuestions)
    setTotalItems(total)
    setCurrentIndex(0)
    setScore(0)
    setIsFinished(false)
  }, [vocabList, mode])

  // --- HÀM CẬP NHẬT SRS CHUNG ---
  const updateSRS = async (vocabId: string, isCorrect: boolean) => {
    const currentVocab = vocabList.find(v => v.id === vocabId)
    if (!currentVocab) return

    const grade = isCorrect ? 4 : 1 
    const currentSRS: SRSData = {
        interval: currentVocab.interval || 0,
        easeFactor: currentVocab.ease_factor || 2.5,
        lapses: currentVocab.lapses || 0
    }
    const newSRS = calculateSRS(currentSRS, grade)
    
    await supabase.from('vocab').update({
        interval: newSRS.interval,
        ease_factor: newSRS.easeFactor,
        lapses: newSRS.lapses,
        next_review: new Date(Date.now() + newSRS.interval * 86400000).toISOString()
    }).eq('id', vocabId)
  }

  // 2. Handler cho Trắc nghiệm & Typing (1 từ/lần)
  const handleSingleAnswer = async (isCorrect: boolean) => {
    if (isCorrect) setScore(s => s + 1)
    
    const currentQuestion = questions[currentIndex]
    await updateSRS(currentQuestion.data.id, isCorrect)

    nextQuestion()
  }

  // 3. Handler cho Matching (Nhiều từ/lần)
  const handleBatchAnswer = async (results: { id: string; isCorrect: boolean }[]) => {
    const correctCount = results.filter(r => r.isCorrect).length
    setScore(s => s + correctCount)

    for (const res of results) {
      await updateSRS(res.id, res.isCorrect)
    }

    nextQuestion()
  }

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setIsFinished(true)
    }
  }

  // --- MÀN HÌNH KẾT THÚC ---
  if (isFinished) {
    const percentage = totalItems > 0 ? Math.round((score / totalItems) * 100) : 0
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Trophy className="w-12 h-12 text-yellow-600" />
            </div>
            <h2 className="text-3xl font-black text-zinc-900 mb-2">Hoàn thành!</h2>
            <p className="text-zinc-500 mb-8">Kết quả: <span className="font-bold text-zinc-900">{score}/{totalItems}</span> từ vựng.</p>
            
            <div className="w-full max-w-xs bg-zinc-100 rounded-full h-4 mb-8 overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ease-out ${percentage >= 80 ? 'bg-green-500' : 'bg-orange-500'}`} 
                    style={{ width: `${percentage}%` }} 
                />
            </div>

            <div className="flex gap-4">
                <Button variant="outline" onClick={onExit} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Quay lại
                </Button>
                <Button onClick={() => {
                    window.location.reload() 
                }} className="bg-zinc-900 gap-2">
                    <RefreshCcw className="w-4 h-4" /> Chơi lại
                </Button>
            </div>
        </div>
    )
  }

  if (questions.length === 0) return <div className="p-10 text-center text-zinc-400">Đang tạo bài tập...</div>

  const currentQ = questions[currentIndex]
  const progressVal = ((currentIndex) / questions.length) * 100

  return (
    <div className="h-full flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-zinc-100 flex items-center px-4 md:px-8 justify-between shrink-0">
            <Button variant="ghost" size="icon" onClick={onExit} className="text-zinc-400 hover:text-zinc-900">
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 mx-4 md:mx-8">
                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    <span>Quiz Progress</span>
                    <span>{Math.round(progressVal)}%</span>
                </div>
                <Progress value={progressVal} className="h-2" />
            </div>
            <div className="w-9" />
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto">
            {currentQ.type === 'matching' ? (
              <QuizMatching 
                vocabBatch={currentQ.data}
                onComplete={handleBatchAnswer}
              />
            ) : currentQ.type === 'typing' ? (
              <QuizTyping
                vocab={currentQ.data}
                onResult={handleSingleAnswer}
              />
            ) : (
              (currentQ.type === 'meaning' || currentQ.type === 'reading') && (
                <QuizMultipleChoice 
                    vocab={currentQ.data}
                    allVocabs={vocabList}
                    mode={currentQ.type}
                    direction={options?.direction || 'forward'} // <--- TRUYỀN HƯỚNG XUỐNG THẺ
                    onResult={handleSingleAnswer}
                />
              )
            )}
        </div>
    </div>
  )
}