'use client'

import { cn } from "@/lib/utils"
import { Volume2 } from "lucide-react"
import { VocabPopover } from '@/components/deck/vocab-popover'
import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

interface FlashcardItemProps {
  vocab: any
  isFlipped: boolean
  onFlip: () => void
}

export const speakText = (text: string) => {
  if (!text) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ja-JP'
  utterance.rate = 0.9 
  window.speechSynthesis.speak(utterance)
}

// Hàm loại bỏ Romaji: "ほうもん (houmon)" -> "ほうもん"
const cleanReading = (reading: string) => {
  if (!reading) return ''
  return reading.split('(')[0].trim()
}

function InteractiveExample({ text }: { text: string }) {
  const [nodes, setNodes] = useState<React.ReactNode[] | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchTokens = async () => {
      try {
        const res = await fetch(`${API_URL}/api/nlp/tokenize`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ text })
        })
        const data = await res.json()
        if (isMounted) {
          const tokenNodes = data.tokens.map((t: string, i: number) => (
            <VocabPopover key={i} word={t}>
              <span className="cursor-pointer hover:bg-zinc-700 hover:text-white transition-colors py-0.5 rounded-sm select-text inline-block">
                {t}
              </span>
            </VocabPopover>
          ))
          setNodes(tokenNodes)
        }
      } catch (e) {
        if (isMounted) setNodes([<span key="raw">{text}</span>])
      }
    }
    fetchTokens()
    return () => { isMounted = false }
  }, [text])

  if (!nodes) return <span className="animate-pulse bg-zinc-800 rounded text-transparent select-none">{text}</span>

  return <div className="text-lg leading-relaxed text-zinc-200 text-left font-medium">{nodes}</div>
}

export function FlashcardItem({ vocab, isFlipped, onFlip }: FlashcardItemProps) {
  if (!vocab) return null

  const handleSpeakWord = (e: React.MouseEvent) => {
    e.stopPropagation()
    speakText(vocab.word)
  }

  const cleanHiragana = cleanReading(vocab.reading)

  return (
    <div 
      className="w-full h-full cursor-pointer perspective-1000 select-none"
      onClick={onFlip}
    >
      <div 
        className={cn(
          "relative w-full h-full transition-all duration-500 transform-style-3d",
          isFlipped ? "rotate-y-180" : ""
        )}
      >
        {/* MẶT TRƯỚC */}
        <div className="absolute w-full h-full backface-hidden bg-white flex flex-col items-center justify-center p-4">
          <div className="absolute top-6 right-6 z-10">
            <button 
              onClick={handleSpeakWord} 
              className="p-4 bg-zinc-50 rounded-full hover:bg-zinc-100 text-zinc-600 transition-colors"
              title="Phát âm"
            >
              <Volume2 className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center w-full">
             <span className="text-xs font-bold text-zinc-300 uppercase tracking-[0.2em] mb-8">Từ vựng</span>
             <h2 className="text-6xl md:text-8xl font-black text-zinc-900 text-center break-words leading-tight">
                {vocab.word}
             </h2>
             <p className="text-zinc-300 text-[10px] mt-10 animate-pulse font-medium">CHẠM ĐỂ XEM NGHĨA</p>
          </div>
        </div>

        {/* MẶT SAU (Nền đen) */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-zinc-900 text-white overflow-y-auto no-scrollbar">
          {/* Dùng min-h-full để khi ít nội dung thì nó tự căn giữa, nhiều thì cho phép cuộn */}
          <div className="min-h-full flex flex-col items-center justify-center px-6 py-10 w-full max-w-lg mx-auto">
            
            {/* --- KHỐI TỪ VỰNG CHÍNH --- */}
            <div className="flex flex-col items-center w-full">
              {/* 1. Phiên âm Hiragana (Furigana - Nhỏ, nằm trên) */}
              <div className="text-xl md:text-2xl font-bold text-blue-400 tracking-wide mb-2">
                {cleanHiragana}
              </div>

              {/* 2. Từ Kanji (Chữ to, nằm dưới) */}
              <div className="text-5xl md:text-6xl font-black text-white tracking-widest mb-5 text-center leading-tight">
                {vocab.word}
              </div>

              {/* 3. Nghĩa Tiếng Việt */}
              <div className="text-xl md:text-2xl font-semibold text-white/90 text-center">
                {vocab.meaning}
              </div>
            </div>
            
            {/* Lằn gạch chia cách (Chỉ hiện nếu có ví dụ) */}
            {vocab.examples && vocab.examples.length > 0 && (
                <div className="w-full border-t border-zinc-800 my-6"></div>
            )}
            
            {/* --- KHỐI VÍ DỤ --- */}
            {/* Dừng sự kiện click để thẻ không bị lật lại khi user đang thao tác với câu ví dụ */}
            <div className="w-full flex flex-col gap-8" onClick={(e) => e.stopPropagation()}>
              {vocab.examples?.map((ex: any, idx: number) => {
                if (!ex.sentence) return null;
                
                return (
                  <div key={idx} className="flex flex-col gap-2 w-full">
                    {/* Hàng chứa Nút loa + Câu tiếng Nhật */}
                    <div className="flex items-start gap-3">
                        <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              speakText(ex.sentence); 
                            }}
                            className="mt-1 shrink-0 p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white"
                            title={`Nghe ví dụ ${idx + 1}`}
                        >
                            <Volume2 className="h-4 w-4" />
                        </button>
                        
                        <div className="flex-1 pt-0.5">
                            <InteractiveExample text={ex.sentence} />
                        </div>
                    </div>

                    {/* Dịch nghĩa tiếng Việt (thụt lề cho thẳng với câu trên) */}
                    <p className="text-base md:text-lg text-zinc-500 italic font-light ml-11 text-left">
                        {ex.translation}
                    </p>
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}