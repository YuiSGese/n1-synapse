'use client'

import { cn } from "@/lib/utils"
import { Volume2 } from "lucide-react"
import { VocabPopover } from '@/components/deck/vocab-popover' // Giả sử vocab-popover vẫn ở chỗ cũ hoặc bạn có thể chuyển nó vào review/quiz nếu muốn
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
              {/* Dùng inline-block để text liền mạch */}
              <span className="cursor-pointer hover:bg-zinc-700 hover:text-white transition-colors py-0.5 rounded-sm select-text">
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

  const handleSpeakExample = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (vocab.examples?.[0]?.sentence) {
      speakText(vocab.examples[0].sentence)
    }
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
        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-zinc-900 text-white flex flex-col items-center justify-center px-6 py-8">
          <div className="absolute top-6 right-6 z-10">
            <button onClick={handleSpeakExample} className="p-3 bg-zinc-800 rounded-full hover:bg-zinc-700 transition">
              <Volume2 className="h-6 w-6 text-zinc-400" />
            </button>
          </div>
          
          <div className="flex flex-col items-center w-full max-w-md h-full justify-center gap-6">
            
            {/* 1. Phiên âm Hiragana (Đậm, Lớn) */}
            <div className="text-4xl font-bold text-blue-400 tracking-wide">
              {cleanHiragana}
            </div>

            {/* 2. Từ Kanji (Nhắc lại) */}
            <div className="text-xl text-zinc-500 font-medium tracking-widest">
              {vocab.word}
            </div>

            {/* 3. Nghĩa Tiếng Việt (Vừa phải) */}
            <div className="text-2xl font-semibold leading-snug text-white/90 text-center border-t border-zinc-800 pt-4 w-full">
              {vocab.meaning}
            </div>
            
            {/* 4. Ví dụ (Bỏ khung, Chữ to, Interactive) */}
            {vocab.examples?.[0]?.sentence && (
              <div className="w-full mt-4 text-center" onClick={(e) => e.stopPropagation()}>
                {/* Component tách từ click được */}
                <InteractiveExample text={vocab.examples[0].sentence} />
                
                <p className="text-base text-zinc-500 italic mt-3 font-light">
                  {vocab.examples[0].translation}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}