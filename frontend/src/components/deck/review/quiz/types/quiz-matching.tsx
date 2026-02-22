'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { speakText } from '@/components/deck/flashcard'
import { CheckCircle2 } from 'lucide-react'

interface QuizMatchingProps {
  vocabBatch: any[] // Danh sách từ cho lượt chơi này (VD: 6 từ)
  onComplete: (results: { id: string; isCorrect: boolean }[]) => void
}

type Card = {
  id: string // ID của từ vựng (để check khớp)
  content: string // Nội dung hiển thị (Kanji hoặc Nghĩa)
  type: 'term' | 'def'
  vocab: any // Dữ liệu gốc để phát âm
  isMatched: boolean
  uniqueId: number // ID duy nhất cho thẻ này trong mảng cards
}

export function QuizMatching({ vocabBatch, onComplete }: QuizMatchingProps) {
  const [cards, setCards] = useState<Card[]>([])
  const [selected, setSelected] = useState<number | null>(null) // Lưu index thẻ đang chọn
  const [wrongPair, setWrongPair] = useState<number[]>([]) // Lưu cặp index chọn sai
  const [mistakes, setMistakes] = useState<Set<string>>(new Set()) // Lưu ID các từ bị làm sai

  // 1. Chuẩn bị bàn chơi (Trộn thẻ)
  useEffect(() => {
    const newCards: Card[] = []
    vocabBatch.forEach((v, i) => {
      // Thẻ Kanji
      newCards.push({ 
        id: v.id, 
        content: v.word, 
        type: 'term', 
        vocab: v, 
        isMatched: false,
        uniqueId: i * 2 
      })
      // Thẻ Nghĩa
      newCards.push({ 
        id: v.id, 
        content: v.meaning, 
        type: 'def', 
        vocab: v, 
        isMatched: false,
        uniqueId: i * 2 + 1
      })
    })
    // Trộn ngẫu nhiên vị trí
    setCards(newCards.sort(() => Math.random() - 0.5))
  }, [vocabBatch])

  // 2. Xử lý Click thẻ
  const handleCardClick = (index: number) => {
    // Bỏ qua nếu đang xử lý sai, đã match, hoặc click lại chính nó
    if (wrongPair.length > 0 || cards[index].isMatched || selected === index) return

    // Nếu chưa chọn thẻ nào -> Chọn thẻ này
    if (selected === null) {
      setSelected(index)
      // Nếu là thẻ Kanji thì đọc lên cho vui
      if (cards[index].type === 'term') speakText(cards[index].content)
    } 
    // Nếu đã chọn 1 thẻ rồi -> Kiểm tra khớp
    else {
      const first = cards[selected]
      const second = cards[index]

      if (first.id === second.id) {
        // MATCH: Đúng cặp!
        const newCards = [...cards]
        newCards[selected].isMatched = true
        newCards[index].isMatched = true
        setCards(newCards)
        setSelected(null)
        
        // Phát âm từ vựng khi đúng
        speakText(first.vocab.word)

        // Kiểm tra xem hết bài chưa
        if (newCards.every(c => c.isMatched)) {
          // TĂNG ĐỘ TRỄ LÊN 2S (2000ms)
          setTimeout(() => {
            // Tổng kết điểm: Những từ nào không nằm trong set mistakes là đúng (isCorrect: true)
            const results = vocabBatch.map(v => ({
              id: v.id,
              isCorrect: !mistakes.has(v.id)
            }))
            onComplete(results)
          }, 2000) 
        }
      } else {
        // WRONG: Sai cặp!
        setWrongPair([selected, index])
        
        // Ghi nhận từ này đã bị làm sai (cả 2 từ liên quan đều tính là sai lượt này)
        setMistakes(prev => new Set(prev).add(first.id).add(second.id))

        // Reset sau 1s (hiệu ứng rung lắc)
        setTimeout(() => {
          setWrongPair([])
          setSelected(null)
        }, 800)
      }
    }
  }

  return (
    <div className="h-full flex flex-col p-4 max-w-4xl mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-zinc-800">Nối từ vựng</h2>
        <p className="text-xs text-zinc-400">Chọn các cặp từ và nghĩa tương ứng</p>
      </div>

      {/* GRID THẺ BÀI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 flex-1 content-start">
        {cards.map((card, idx) => {
          const isSelected = selected === idx
          const isWrong = wrongPair.includes(idx)
          
          if (card.isMatched) {
            return <div key={card.uniqueId} className="invisible">Placeholder</div> // Giữ chỗ để không vỡ layout
          }

          return (
            <button
              key={card.uniqueId}
              onClick={() => handleCardClick(idx)}
              className={cn(
                "h-24 md:h-32 p-3 rounded-xl border-2 flex items-center justify-center text-center transition-all duration-200 active:scale-95 shadow-sm text-sm md:text-base font-medium",
                isSelected 
                  ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200" 
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:shadow-md",
                isWrong && "border-red-500 bg-red-50 text-red-700 animate-shake",
                card.type === 'term' ? "font-bold text-lg" : "font-normal"
              )}
            >
              {card.content}
            </button>
          )
        })}
      </div>
    </div>
  )
}