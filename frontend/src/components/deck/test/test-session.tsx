'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { QuizMultipleChoice } from '@/components/deck/review/quiz/types/quiz-multiple-choice'
import { QuizMatching } from '@/components/deck/review/quiz/types/quiz-matching'
import { QuizTyping } from '@/components/deck/review/quiz/types/quiz-typing'
import { Trophy, ArrowLeft, ArrowUpCircle, ArrowDownCircle, Swords, Target, Search, Type } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

type QuestionItem = {
  type: 'meaning' | 'reading' | 'matching' | 'typing'
  data: any
}

type TestResult = {
  vocab: any;
  oldLevel: number;
  newLevel: number;
  isCorrect: boolean;
}

interface TestSessionProps {
  vocabList: any[]
  onExit: () => void
  batchSize?: number | 'all' // <--- THÊM PROP NÀY VÀO INTERFACE
}

// THÊM batchSize VÀO HÀM (Cài mặc định là 10 đề phòng trường hợp lỗi không nhận được)
export function TestSession({ vocabList, onExit, batchSize = 10 }: TestSessionProps) {
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<TestResult[]>([])
  const [isFinished, setIsFinished] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  
  const supabase = createClient()

  const initBatch = useCallback(() => {
    setIsInitializing(true)
    // 1. Lọc ra những từ chưa đạt Mastery (Level < 3)
    const candidates = vocabList.filter(v => (v.mastery_level || 0) < 3)
    
    // Nếu đã thuộc hết rồi thì kết thúc luôn
    if (candidates.length === 0) {
        setIsFinished(true)
        setIsInitializing(false)
        return
    }

    // 2. Rút ngẫu nhiên một mẻ (batch) theo số lượng đã chọn
    const limit = batchSize === 'all' ? candidates.length : batchSize
    const batch = candidates.sort(() => 0.5 - Math.random()).slice(0, limit)
    
    let newQuestions: QuestionItem[] = []
    let matchBatch: any[] = []

    // 3. Phân loại từ vựng vào các Game tương ứng với Level
    batch.forEach(v => {
        const level = v.mastery_level || 0
        if (level === 0) {
            // Level 0: Trắc nghiệm (Random hỏi Nghĩa hoặc Hiragana)
            newQuestions.push({ type: Math.random() > 0.5 ? 'meaning' : 'reading', data: v })
        } else if (level === 1) {
            // Level 1: Thu thập để làm game Nối từ
            matchBatch.push(v)
        } else if (level === 2) {
            // Level 2: Gõ từ (Typing)
            newQuestions.push({ type: 'typing', data: v })
        }
    })

    // Xử lý mảng Matching (Gom nhóm 6 thẻ)
    for (let i = 0; i < matchBatch.length; i += 6) {
        const chunk = matchBatch.slice(i, i + 6)
        if (chunk.length === 1) {
            // Nếu bị lẻ 1 từ, cho nó về dạng trắc nghiệm cho đỡ lỗi UI
            newQuestions.push({ type: 'meaning', data: chunk[0] })
        } else {
            newQuestions.push({ type: 'matching', data: chunk })
        }
    }

    // Xáo trộn ngẫu nhiên thứ tự các Game
    newQuestions = newQuestions.sort(() => 0.5 - Math.random())

    setQuestions(newQuestions)
    setCurrentIndex(0)
    setResults([])
    setIsFinished(false)
    setIsInitializing(false)
  }, [vocabList])

  useEffect(() => {
    initBatch()
  }, [initBatch])

  // --- LOGIC CẬP NHẬT ĐIỂM SỐ LÊN DATABASE ---
  const updateMastery = async (vocabId: string, isCorrect: boolean) => {
    const v = vocabList.find(x => x.id === vocabId)
    if (!v) return

    const oldLevel = v.mastery_level || 0
    // Đúng: Tăng 1 max 3. Sai: Giảm 1 min 0.
    const newLevel = isCorrect ? Math.min(3, oldLevel + 1) : Math.max(0, oldLevel - 1)

    // Ghi nhận vào state để lát show màn hình kết quả
    setResults(prev => [...prev, { vocab: v, oldLevel, newLevel, isCorrect }])

    // Lưu âm thầm lên Database
    await supabase.from('vocab').update({ mastery_level: newLevel }).eq('id', vocabId)
  }

  const handleSingleAnswer = async (isCorrect: boolean) => {
    const currentQuestion = questions[currentIndex]
    await updateMastery(currentQuestion.data.id, isCorrect)
    nextQuestion()
  }

  const handleBatchAnswer = async (batchResults: { id: string; isCorrect: boolean }[]) => {
    for (const res of batchResults) {
        await updateMastery(res.id, res.isCorrect)
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

  // --- MÀN HÌNH CHỜ ---
  if (isInitializing) return <div className="p-10 text-center text-zinc-400">Đang chuẩn bị Đấu trường...</div>

  // --- MÀN HÌNH TỔNG KẾT SAU KHI TEST XONG 1 BATCH ---
  if (isFinished) {
      if (results.length === 0) {
          return (
              <div className="h-full flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-500">
                  <Trophy className="w-16 h-16 text-yellow-500 mb-4" />
                  <h2 className="text-2xl font-black text-zinc-900 mb-2">Chúc mừng!</h2>
                  <p className="text-zinc-500 mb-6">Bạn đã đạt 100% Mastery cho bài học này.</p>
                  <Button onClick={onExit} className="bg-zinc-900 text-white px-8">Quay lại</Button>
              </div>
          )
      }

      return (
          <div className="h-full flex flex-col p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-2xl mx-auto w-full">
              <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                      <Swords className="w-6 h-6 text-blue-500" /> Kết quả chiến đấu
                  </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 no-scrollbar mb-6">
                  {results.map((r, idx) => (
                      <div key={idx} className={`p-4 border rounded-xl flex justify-between items-center shadow-sm ${r.isCorrect ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                          <div>
                              <p className="font-bold text-lg text-zinc-800">{r.vocab.word}</p>
                              <p className="text-sm text-zinc-500 mt-0.5">{r.vocab.reading} • {r.vocab.meaning}</p>
                          </div>
                          
                          {/* Hiển thị Level thay đổi */}
                          <div className="flex items-center gap-2 font-mono font-bold">
                              <span className="text-zinc-400 text-lg">Lv.{r.oldLevel}</span>
                              {r.isCorrect ? (
                                  <ArrowUpCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                  <ArrowDownCircle className="w-5 h-5 text-red-500" />
                              )}
                              <span className={`text-lg ${r.isCorrect ? 'text-green-600' : 'text-red-600'}`}>Lv.{r.newLevel}</span>
                          </div>
                      </div>
                  ))}
              </div>

              <div className="flex gap-3 mt-auto shrink-0">
                  <Button variant="outline" onClick={onExit} className="flex-1 h-12">
                      Thoát ra
                  </Button>
                  {/* Nút onExit sẽ kích hoạt reload dữ liệu mới, sau đó user có thể bấm test tiếp từ TestManager */}
                  <Button onClick={onExit} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold">
                      Cập nhật tiến độ
                  </Button>
              </div>
          </div>
      )
  }

  // --- MÀN HÌNH CHƠI GAME ---
  const currentQ = questions[currentIndex]
  const progressVal = ((currentIndex) / questions.length) * 100

  // Xác định icon level hiện tại để gợi ý cho user
  const LevelIndicator = () => {
      if (currentQ.type === 'meaning' || currentQ.type === 'reading') return <Badge icon={<Search className="w-3 h-3"/>} text="Lv.0 Nhận biết" color="bg-zinc-100 text-zinc-600" />
      if (currentQ.type === 'matching') return <Badge icon={<Target className="w-3 h-3"/>} text="Lv.1 Liên kết" color="bg-orange-100 text-orange-700" />
      return <Badge icon={<Type className="w-3 h-3"/>} text="Lv.2 Hồi tưởng" color="bg-blue-100 text-blue-700" />
  }

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
        <div className="h-16 border-b border-zinc-200 bg-white flex items-center px-4 md:px-8 justify-between shrink-0 shadow-sm z-10">
            <Button variant="ghost" size="icon" onClick={onExit} className="text-zinc-400 hover:text-zinc-900">
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 mx-6 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase">
                    <LevelIndicator />
                    <span className="text-zinc-400">{currentIndex + 1} / {questions.length}</span>
                </div>
                <Progress value={progressVal} className="h-1.5 bg-zinc-100" />
            </div>
            <div className="w-9" />
        </div>

        <div className="flex-1 overflow-hidden relative">
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
                    direction="forward" // Luôn hỏi xuôi cho đỡ ngợp
                    onResult={handleSingleAnswer}
                />
              )
            )}
        </div>
    </div>
  )
}

function Badge({ icon, text, color }: { icon: any, text: string, color: string }) {
    return <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${color}`}>{icon} <span>{text}</span></div>
}