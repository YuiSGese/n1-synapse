'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { Button } from '@/components/ui/button'
import { Flashcard, speakText } from './flashcard'
import { QuizCard } from './quiz-card' // <--- Import mới
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Settings2, Frown, Meh, Smile, CheckCircle2, GraduationCap, LayoutTemplate 
} from 'lucide-react'
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { calculateSRS, SRSData } from '@/lib/srs'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs" // Dùng Tabs nhỏ để chọn mode

interface ReviewSectionProps {
  vocabList: any[]
}

export function ReviewSection({ vocabList }: ReviewSectionProps) {
  const [cards, setCards] = useState<any[]>(vocabList)
  const [isFlipped, setIsFlipped] = useState(false)
  
  // States
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(3)
  const [autoAudio, setAutoAudio] = useState(false)
  const [mode, setMode] = useState<'flashcard' | 'quiz'>('flashcard') // <--- State Mode
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const supabase = createClient()
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    const index = emblaApi.selectedScrollSnap()
    setSelectedIndex(index)
    setIsFlipped(false)
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi, onSelect])

  // --- LOGIC AUDIO (Chỉ chạy ở Flashcard mode hoặc khi hiện câu hỏi quiz) ---
  useEffect(() => {
    if (autoAudio && !isFlipped && cards[selectedIndex] && mode === 'flashcard') {
      const timer = setTimeout(() => {
        speakText(cards[selectedIndex].word)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [selectedIndex, autoAudio, cards, isFlipped, mode])

  // --- LOGIC SRS (Chung) ---
  const updateSRS = async (vocabId: string, grade: 1 | 2 | 3 | 4) => {
    const currentCard = cards.find(c => c.id === vocabId)
    if (!currentCard) return

    const currentSRS: SRSData = {
      interval: currentCard.interval || 0,
      easeFactor: currentCard.ease_factor || 2.5,
      lapses: currentCard.lapses || 0
    }
    const newSRS = calculateSRS(currentSRS, grade)
    
    // Update local state
    const updatedCards = cards.map(c => 
        c.id === vocabId ? { ...c, ...newSRS, next_review: new Date(Date.now() + newSRS.interval * 86400000).toISOString() } : c
    )
    setCards(updatedCards)

    // Update DB
    await supabase.from('vocab').update({
        interval: newSRS.interval,
        ease_factor: newSRS.easeFactor,
        lapses: newSRS.lapses,
        next_review: new Date(Date.now() + newSRS.interval * 86400000).toISOString()
    }).eq('id', vocabId)
  }

  // --- HANDLER CHO QUIZ ---
  const handleQuizResult = (isCorrect: boolean) => {
    // Đúng -> Easy (4), Sai -> Again (1)
    const grade = isCorrect ? 4 : 1
    const currentCard = cards[selectedIndex]
    if (currentCard) {
        updateSRS(currentCard.id, grade)
    }
    
    // Tự động chuyển câu
    if (emblaApi && emblaApi.canScrollNext()) {
        emblaApi.scrollNext()
    } else {
        toast.success("Hoàn thành bài trắc nghiệm!")
    }
  }

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setSelectedIndex(0)
    setIsFlipped(false)
    emblaApi?.scrollTo(0)
  }

  // --- RENDER ---
  if (cards.length === 0) return <div className="text-center p-10 text-zinc-400">Trống</div>

  return (
    <div className="w-full h-[calc(100vh-180px)] md:h-[600px] flex flex-col">
      <div className="bg-white rounded-xl md:rounded-3xl shadow-sm md:shadow-2xl border border-zinc-100 overflow-hidden flex flex-col h-full relative">
        
        {/* SLIDER AREA */}
        <div className="flex-1 overflow-hidden relative bg-zinc-50" ref={emblaRef}>
          <div className="flex h-full touch-pan-y">
            {cards.map((vocab, index) => (
              <div key={vocab.id || index} className="flex-[0_0_100%] min-w-0 relative h-full">
                <div className="h-full w-full bg-white">
                   {mode === 'flashcard' ? (
                       <Flashcard 
                          vocab={vocab} 
                          isFlipped={index === selectedIndex ? isFlipped : false} 
                          onFlip={() => { if (index === selectedIndex) setIsFlipped(!isFlipped) }} 
                       />
                   ) : (
                       <QuizCard 
                          vocab={vocab} 
                          allVocabs={vocabList} // Truyền toàn bộ list để lấy nhiễu
                          onResult={handleQuizResult}
                          autoAudio={autoAudio && index === selectedIndex}
                       />
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CONTROLS AREA */}
        <div className="bg-white/95 backdrop-blur-xl border-t border-zinc-100 p-4 md:p-6 z-10 pb-6 md:pb-8 transition-all">
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
              <span>{mode === 'quiz' ? 'Question' : 'Card'} {selectedIndex + 1}</span>
              <span>Total {cards.length}</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-300 ease-out", mode === 'quiz' ? "bg-purple-500" : "bg-zinc-900")}
                style={{ width: `${((selectedIndex + 1) / cards.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Flashcard Rate Buttons */}
          {mode === 'flashcard' && isFlipped ? (
            <div className="flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
              <Button onClick={() => updateSRS(cards[selectedIndex].id, 1)} className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 h-14 rounded-xl"><Frown className="h-5 w-5" /></Button>
              <Button onClick={() => updateSRS(cards[selectedIndex].id, 2)} className="flex-1 bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100 h-14 rounded-xl"><Meh className="h-5 w-5" /></Button>
              <Button onClick={() => updateSRS(cards[selectedIndex].id, 3)} className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 h-14 rounded-xl"><Smile className="h-5 w-5" /></Button>
              <Button onClick={() => updateSRS(cards[selectedIndex].id, 4)} className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 border border-green-100 h-14 rounded-xl"><CheckCircle2 className="h-5 w-5" /></Button>
            </div>
          ) : (
            /* Player Controls */
            <div className="flex items-center justify-between animate-in slide-in-from-bottom-2 fade-in duration-300">
              <Button variant="ghost" size="icon" onClick={handleShuffle} className="text-zinc-400 hover:text-zinc-900"><Shuffle className="h-5 w-5" /></Button>
              <Button variant="ghost" size="icon" onClick={() => emblaApi?.scrollPrev()} disabled={!emblaApi?.canScrollPrev()} className="text-zinc-800 hover:bg-zinc-100 h-10 w-10"><SkipBack className="h-6 w-6" /></Button>
              
              {/* Play/Pause (Chỉ hiện ở Flashcard mode) */}
              {mode === 'flashcard' && (
                  <Button size="icon" onClick={() => setIsPlaying(!isPlaying)} className={cn("h-14 w-14 rounded-full shadow-xl hover:scale-105 transition-all", isPlaying ? "bg-zinc-900" : "bg-zinc-900")}>
                    {isPlaying ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white ml-1" />}
                  </Button>
              )}
              {/* Ở Quiz mode thì không cần nút Play giữa, chỉ cần Next */}
              {mode === 'quiz' && <div className="w-14"></div>}

              <Button variant="ghost" size="icon" onClick={() => emblaApi?.scrollNext()} disabled={!emblaApi?.canScrollNext()} className="text-zinc-800 hover:bg-zinc-100 h-10 w-10"><SkipForward className="h-6 w-6" /></Button>
              
              {/* SETTINGS POPOVER (Chứa nút chuyển mode) */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-900"><Settings2 className="h-5 w-5" /></Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4" side="top" align="end">
                  <div className="space-y-5">
                    {/* Chọn chế độ */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-zinc-500 uppercase">Chế độ học</Label>
                        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
                            <TabsList className="w-full grid grid-cols-2">
                                <TabsTrigger value="flashcard"><LayoutTemplate className="h-3 w-3 mr-2"/> Thẻ</TabsTrigger>
                                <TabsTrigger value="quiz"><GraduationCap className="h-3 w-3 mr-2"/> Quiz</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-zinc-500 uppercase">Tốc độ (giây)</Label>
                      <Slider value={[speed]} onValueChange={(val: number[]) => setSpeed(val[0])} min={1} max={10} step={1} />
                    </div>
                    <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                      <Label htmlFor="auto-audio" className="text-sm font-medium text-zinc-700">Tự động phát âm</Label>
                      <Switch id="auto-audio" checked={autoAudio} onCheckedChange={setAutoAudio} />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}