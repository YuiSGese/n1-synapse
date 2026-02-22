'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { Button } from '@/components/ui/button'
import { FlashcardItem, speakText } from './flashcard-item' // <--- Import từ file mới
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Settings2, Frown, Meh, Smile, CheckCircle2, ArrowLeft
} from 'lucide-react'
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { calculateSRS, SRSData } from '@/lib/srs'
import { toast } from 'sonner'

interface FlashcardSessionProps {
  vocabList: any[]
  onExit: () => void 
}

export function FlashcardSession({ vocabList, onExit }: FlashcardSessionProps) {
  const [cards, setCards] = useState<any[]>(vocabList)
  const [isFlipped, setIsFlipped] = useState(false)
  const supabase = createClient()
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(3)
  const [autoAudio, setAutoAudio] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

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

  // LOGIC AUTO-AUDIO (WORD)
  useEffect(() => {
    if (autoAudio && !isFlipped && cards[selectedIndex]) {
      const timer = setTimeout(() => {
        speakText(cards[selectedIndex].word)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [selectedIndex, autoAudio, cards, isFlipped])

  // LOGIC AUTO-AUDIO (EXAMPLE)
  useEffect(() => {
    if (autoAudio && isFlipped && cards[selectedIndex]) {
      const timer = setTimeout(() => {
        const example = cards[selectedIndex].examples?.[0]?.sentence
        if (example) speakText(example)
      }, 300) 
      return () => clearTimeout(timer)
    }
  }, [isFlipped, autoAudio, selectedIndex, cards])

  // Logic Auto-Play (Slideshow)
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        if (!isFlipped) {
          setIsFlipped(true)
        } else {
          if (emblaApi && emblaApi.canScrollNext()) {
            emblaApi.scrollNext()
          } else {
            setIsPlaying(false)
          }
        }
      }, speed * 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isPlaying, isFlipped, speed, emblaApi])

  const togglePlay = () => setIsPlaying(!isPlaying)
  const scrollPrev = () => emblaApi && emblaApi.scrollPrev()
  const scrollNext = () => emblaApi && emblaApi.scrollNext()
  
  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setSelectedIndex(0)
    setIsFlipped(false)
    emblaApi?.scrollTo(0)
  }

  const handleRate = async (grade: 1 | 2 | 3 | 4) => {
    const currentCard = cards[selectedIndex]
    if (!currentCard) return

    const currentSRS: SRSData = {
      interval: currentCard.interval || 0,
      easeFactor: currentCard.ease_factor || 2.5,
      lapses: currentCard.lapses || 0
    }

    const newSRS = calculateSRS(currentSRS, grade)

    const updatedCards = [...cards]
    updatedCards[selectedIndex] = { 
      ...currentCard, 
      ...newSRS, 
      next_review: new Date(Date.now() + newSRS.interval * 24 * 60 * 60 * 1000).toISOString()
    }
    setCards(updatedCards)

    if (emblaApi && emblaApi.canScrollNext()) {
      emblaApi.scrollNext()
    } else {
      toast.success("Đã hết thẻ!")
      setIsPlaying(false)
    }

    try {
      await supabase.from('vocab').update({
        interval: newSRS.interval,
        ease_factor: newSRS.easeFactor,
        lapses: newSRS.lapses,
        next_review: new Date(Date.now() + newSRS.interval * 24 * 60 * 60 * 1000).toISOString()
      }).eq('id', currentCard.id)
    } catch (error) {
      console.error("Lỗi lưu SRS:", error)
    }
  }

  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="absolute top-4 left-4 z-20">
        <Button variant="ghost" size="sm" onClick={onExit} className="text-zinc-400 hover:text-zinc-800 bg-white/50 backdrop-blur-sm border border-zinc-100">
            <ArrowLeft className="w-4 h-4 mr-1" /> Thoát
        </Button>
      </div>

      <div className="bg-white rounded-xl md:rounded-3xl shadow-sm md:shadow-2xl border border-zinc-100 overflow-hidden flex flex-col h-full relative">
        <div className="flex-1 overflow-hidden relative bg-zinc-50" ref={emblaRef}>
          <div className="flex h-full touch-pan-y">
            {cards.map((vocab, index) => (
              <div key={vocab.id || index} className="flex-[0_0_100%] min-w-0 relative h-full">
                <div className="h-full w-full bg-white">
                   <FlashcardItem 
                      vocab={vocab} 
                      isFlipped={index === selectedIndex ? isFlipped : false} 
                      onFlip={() => {
                        if (index === selectedIndex) setIsFlipped(!isFlipped)
                      }} 
                   />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl border-t border-zinc-100 p-4 md:p-6 z-10 pb-6 md:pb-8 transition-all duration-300">
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
              <span>Card {selectedIndex + 1}</span>
              <span>Total {cards.length}</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-zinc-900 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${((selectedIndex + 1) / cards.length) * 100}%` }}
              />
            </div>
          </div>

          {/* TẠM ẨN CỤM NÚT ĐÁNH GIÁ SRS
          {isFlipped && !isPlaying ? (
            <div className="flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
              <Button onClick={() => handleRate(1)} className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 h-14 rounded-xl flex-col gap-1"><Frown className="h-5 w-5" /><span className="text-[10px] uppercase font-bold">Quên</span></Button>
              <Button onClick={() => handleRate(2)} className="flex-1 bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100 h-14 rounded-xl flex-col gap-1"><Meh className="h-5 w-5" /><span className="text-[10px] uppercase font-bold">Khó</span></Button>
              <Button onClick={() => handleRate(3)} className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 h-14 rounded-xl flex-col gap-1"><Smile className="h-5 w-5" /><span className="text-[10px] uppercase font-bold">Được</span></Button>
              <Button onClick={() => handleRate(4)} className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 border border-green-100 h-14 rounded-xl flex-col gap-1"><CheckCircle2 className="h-5 w-5" /><span className="text-[10px] uppercase font-bold">Dễ</span></Button>
            </div>
          ) : ( 
          */}

            <div className="flex items-center justify-between animate-in slide-in-from-bottom-2 fade-in duration-300">
              <Button variant="ghost" size="icon" onClick={handleShuffle} className="text-zinc-400 hover:text-zinc-900"><Shuffle className="h-5 w-5" /></Button>
              <Button variant="ghost" size="icon" onClick={scrollPrev} disabled={!emblaApi?.canScrollPrev()} className="text-zinc-800 hover:bg-zinc-100 h-10 w-10"><SkipBack className="h-6 w-6" /></Button>
              <Button size="icon" onClick={togglePlay} className={cn("h-10 w-10 rounded-full shadow-xl hover:scale-105 transition-all", isPlaying ? "bg-zinc-900" : "bg-zinc-900")}>
                {isPlaying ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white ml-1" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={scrollNext} disabled={!emblaApi?.canScrollNext()} className="text-zinc-800 hover:bg-zinc-100 h-10 w-10"><SkipForward className="h-6 w-6" /></Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-900"><Settings2 className="h-5 w-5" /></Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-4" side="top" align="end">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-zinc-500 uppercase">Tốc độ (giây)</Label>
                      <div className="flex items-center gap-3">
                        <Slider value={[speed]} onValueChange={(val: number[]) => setSpeed(val[0])} min={1} max={10} step={1} className="flex-1" />
                        <span className="text-xs font-mono w-4">{speed}s</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                      <Label htmlFor="auto-audio" className="text-sm font-medium text-zinc-700 cursor-pointer">Tự động phát âm</Label>
                      <Switch id="auto-audio" checked={autoAudio} onCheckedChange={setAutoAudio} />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
          {/* )} */}
        </div>
      </div>
    </div>
  )
}