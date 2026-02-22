'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { QuizMultipleChoice } from './types/quiz-multiple-choice'
import { QuizMatching } from './types/quiz-matching'
import { QuizTyping } from './types/quiz-typing'
import { QuizMode } from './quiz-setup'
import { Trophy, RefreshCcw, ArrowLeft, CheckCircle2, XCircle, ListChecks } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { calculateSRS, SRSData } from '@/lib/srs'

type QuestionItem = {
  type: 'meaning' | 'reading' | 'typing' | 'matching'
  data: any
  isRetry?: boolean
}

type QuizResult = {
  vocab: any;
  isCorrect: boolean;
}

interface QuizSessionProps {
  vocabList: any[]
  mode: QuizMode
  options?: any
  onExit: () => void
}

export function QuizSession({ vocabList, mode, options, onExit }: QuizSessionProps) {
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [totalItems, setTotalItems] = useState(0) 
  const [isFinished, setIsFinished] = useState(false)
  const [results, setResults] = useState<QuizResult[]>([])
  const [showReview, setShowReview] = useState(false)
  const supabase = createClient()

  // Đưa logic khởi tạo thành một hàm useCallback để có thể gọi lại dễ dàng
  const initQuiz = useCallback(() => {
    const shuffled = [...vocabList].sort(() => Math.random() - 0.5)
    let newQuestions: QuestionItem[] = []
    let total = 0

    if (mode === 'mixed') {
      let i = 0
      while (i < shuffled.length) {
        const remaining = shuffled.length - i
        const possibleTypes: ('meaning' | 'reading' | 'typing' | 'matching')[] = ['meaning', 'reading', 'typing']
        if (remaining >= 4) possibleTypes.push('matching')
        const randomType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)]

        if (randomType === 'matching') {
          const batchSize = Math.min(remaining, 6)
          const batch = shuffled.slice(i, i + batchSize)
          newQuestions.push({ type: 'matching', data: batch })
          total += batchSize
          i += batchSize
        } else {
          newQuestions.push({ type: randomType, data: shuffled[i] })
          total += 1
          i += 1
        }
      }
    } else if (mode === 'matching') {
      const chunkSize = 6
      for (let i = 0; i < shuffled.length; i += chunkSize) {
        newQuestions.push({ type: 'matching', data: shuffled.slice(i, i + chunkSize) })
      }
      total = shuffled.length
    } else {
      const singleMode = mode as 'meaning' | 'reading' | 'typing'
      newQuestions = shuffled.map(v => ({ type: singleMode, data: v }))
      total = shuffled.length
    }
    
    setQuestions(newQuestions)
    setTotalItems(total)
    setCurrentIndex(0)
    setScore(0)
    setIsFinished(false)
    setResults([]) // Reset kết quả
    setShowReview(false) // Đóng màn xem lại (nếu đang mở)
  }, [vocabList, mode])

  // Gọi hàm khởi tạo khi bắt đầu
  useEffect(() => {
    initQuiz()
  }, [initQuiz])

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

  const handleSingleAnswer = async (isCorrect: boolean) => {
    const currentQuestion = questions[currentIndex]
    
    if (!currentQuestion.isRetry) {
        setResults(prev => [...prev, { vocab: currentQuestion.data, isCorrect }])
        if (isCorrect) setScore(s => s + 1)
        await updateSRS(currentQuestion.data.id, isCorrect)
    }

    let added = false
    if (!isCorrect) {
        setQuestions(prev => [...prev, { ...currentQuestion, isRetry: true }])
        added = true
    }

    if (currentIndex < questions.length - 1 || added) {
        setCurrentIndex(prev => prev + 1)
    } else {
        setIsFinished(true)
    }
  }

  const handleBatchAnswer = async (batchResults: { id: string; isCorrect: boolean }[]) => {
    const currentQuestion = questions[currentIndex]

    if (!currentQuestion.isRetry) {
        const correctCount = batchResults.filter(r => r.isCorrect).length
        setScore(s => s + correctCount)

        const mappedResults = batchResults.map(r => ({
            vocab: currentQuestion.data.find((v: any) => v.id === r.id),
            isCorrect: r.isCorrect
        }))
        setResults(prev => [...prev, ...mappedResults])

        for (const res of batchResults) {
          await updateSRS(res.id, res.isCorrect)
        }
    }

    const wrongIds = batchResults.filter(r => !r.isCorrect).map(r => r.id)
    let added = false

    if (wrongIds.length > 0) {
        const wrongVocabs = currentQuestion.data.filter((v: any) => wrongIds.includes(v.id))
        
        if (wrongVocabs.length === 1) {
            setQuestions(prev => [...prev, { type: 'meaning', data: wrongVocabs[0], isRetry: true }])
        } else {
            setQuestions(prev => [...prev, { type: 'matching', data: wrongVocabs, isRetry: true }])
        }
        added = true
    }

    if (currentIndex < questions.length - 1 || added) {
        setCurrentIndex(prev => prev + 1)
    } else {
        setIsFinished(true)
    }
  }

  if (isFinished) {
    if (showReview) {
        return (
            <div className="h-full flex flex-col p-4 md:p-8 animate-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto w-full">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => setShowReview(false)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h2 className="text-2xl font-bold text-zinc-900">Chi tiết kết quả</h2>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 no-scrollbar">
                    {results.map((r, idx) => (
                        <div key={idx} className="p-4 border border-zinc-100 rounded-xl flex justify-between items-center bg-white shadow-sm">
                            <div>
                                <p className="font-bold text-lg text-zinc-800">{r.vocab?.word}</p>
                                <p className="text-sm text-zinc-500 mt-1">{r.vocab?.reading} • {r.vocab?.meaning}</p>
                            </div>
                            {r.isCorrect ? (
                                <CheckCircle2 className="text-green-500 w-6 h-6 flex-shrink-0" />
                            ) : (
                                <XCircle className="text-red-500 w-6 h-6 flex-shrink-0" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

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

            <div className="flex gap-3">
                <Button variant="outline" onClick={onExit} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Quay lại
                </Button>
                <Button variant="outline" onClick={() => setShowReview(true)} className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                    <ListChecks className="w-4 h-4" /> Xem lại
                </Button>
                {/* Thay vì window.location.reload(), ta gọi initQuiz() để bắt đầu lại mượt mà */}
                <Button onClick={initQuiz} className="bg-zinc-900 gap-2">
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

        <div className="flex-1 overflow-y-auto">
            {currentQ.type === 'matching' ? (
              <QuizMatching 
                key={`match-${currentIndex}`}
                vocabBatch={currentQ.data}
                onComplete={handleBatchAnswer}
              />
            ) : currentQ.type === 'typing' ? (
              <QuizTyping
                key={`type-${currentIndex}`}
                vocab={currentQ.data}
                onResult={handleSingleAnswer}
              />
            ) : (
              (currentQ.type === 'meaning' || currentQ.type === 'reading') && (
                <QuizMultipleChoice 
                    key={`mc-${currentIndex}`}
                    vocab={currentQ.data}
                    allVocabs={vocabList}
                    mode={currentQ.type}
                    direction={options?.direction || 'forward'}
                    onResult={handleSingleAnswer}
                />
              )
            )}
        </div>
    </div>
  )
}