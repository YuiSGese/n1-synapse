'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowLeft, BookOpen, Type, MousePointerClick, Keyboard, Shuffle } from 'lucide-react'

export type QuizMode = 'meaning' | 'reading' | 'matching' | 'typing' | 'mixed'

interface QuizSetupProps {
  onStart: (mode: QuizMode, options?: any) => void
  onBack: () => void
}

export function QuizSetup({ onStart, onBack }: QuizSetupProps) {
  const modes = [
    {
      id: 'meaning',
      title: 'Chọn Nghĩa',
      desc: 'Xem Kanji, chọn nghĩa tiếng Việt đúng (hoặc ngược lại).',
      icon: BookOpen,
      color: 'text-emerald-600 bg-emerald-100',
      border: 'hover:border-emerald-500 hover:ring-emerald-500'
    },
    {
      id: 'reading',
      title: 'Chọn Cách Đọc',
      desc: 'Xem Kanji, chọn Hiragana đúng (hoặc ngược lại).',
      icon: Type,
      color: 'text-blue-600 bg-blue-100',
      border: 'hover:border-blue-500 hover:ring-blue-500'
    },
    {
      id: 'matching',
      title: 'Nối Từ (Matching)',
      desc: 'Game lật thẻ bài. Tìm các cặp từ và nghĩa tương ứng.',
      icon: MousePointerClick,
      color: 'text-purple-600 bg-purple-100',
      border: 'hover:border-purple-500 hover:ring-purple-500'
    },
    {
      id: 'typing',
      title: 'Gõ Từ (Typing)',
      desc: 'Nhập cách đọc Hiragana từ bàn phím để kiểm tra trí nhớ chính xác.',
      icon: Keyboard,
      color: 'text-orange-600 bg-orange-100',
      border: 'hover:border-orange-500 hover:ring-orange-500'
    },
    {
      id: 'mixed',
      title: 'Hỗn Hợp',
      desc: 'Trộn lẫn ngẫu nhiên tất cả các dạng bài tập trên để thử thách tối đa.',
      icon: Shuffle,
      color: 'text-rose-600 bg-rose-100',
      border: 'hover:border-rose-500 hover:ring-rose-500'
    }
  ]

  return (
    <div className="h-full flex flex-col p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 hover:bg-zinc-100">
          <ArrowLeft className="w-5 h-5 text-zinc-600" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Chọn dạng bài tập</h2>
          <p className="text-zinc-500 text-sm">Bạn muốn kiểm tra kiến thức theo cách nào?</p>
        </div>
      </div>

      {/* Grid Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 pb-10">
        {modes.map((mode) => {
          const Icon = mode.icon
          const hasDirection = mode.id === 'meaning' || mode.id === 'reading'

          return (
            <Card
              key={mode.id}
              className={cn(
                "p-5 md:p-6 cursor-pointer border-2 border-zinc-100 transition-all duration-200 flex flex-col h-full shadow-sm group",
                mode.border,
                // Nếu không có nút phụ bên trong thì hover toàn Card sẽ nổi bật
                !hasDirection && "hover:bg-zinc-50 hover:shadow-md" 
              )}
              // Click vào các game không cần chọn chiều (Matching, Typing, Mixed) là vô luôn
              onClick={() => {
                if (!hasDirection) {
                  onStart(mode.id as QuizMode, { direction: 'forward' })
                }
              }}
            >
              {/* Tiêu đề & Icon cùng hàng */}
              <div className="flex items-center gap-4 mb-3">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105", mode.color)}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-zinc-800">{mode.title}</h3>
              </div>

              {/* Mô tả */}
              <p className="text-sm text-zinc-500 leading-relaxed flex-1 mb-5">
                {mode.desc}
              </p>

              {/* Nút hành động trực tiếp (Chỉ có ở Meaning và Reading) */}
              {hasDirection && (
                <div 
                  className="grid grid-cols-2 gap-2 mt-auto" 
                  onClick={(e) => e.stopPropagation()} // Ngăn chặn sự kiện click lan ra ngoài thẻ Card
                >
                  <Button
                    variant="secondary"
                    className={cn(
                       "text-xs md:text-sm font-bold bg-zinc-100 text-zinc-600 hover:text-white transition-colors h-11",
                       mode.id === 'meaning' ? "hover:bg-emerald-500" : "hover:bg-blue-500"
                    )}
                    onClick={() => onStart(mode.id as QuizMode, { direction: 'forward' })}
                  >
                    Kanji ➔ {mode.id === 'meaning' ? 'Nghĩa' : 'Hiragana'}
                  </Button>
                  <Button
                    variant="secondary"
                    className={cn(
                       "text-xs md:text-sm font-bold bg-zinc-100 text-zinc-600 hover:text-white transition-colors h-11",
                       mode.id === 'meaning' ? "hover:bg-emerald-500" : "hover:bg-blue-500"
                    )}
                    onClick={() => onStart(mode.id as QuizMode, { direction: 'reverse' })}
                  >
                    {mode.id === 'meaning' ? 'Nghĩa' : 'Hiragana'} ➔ Kanji
                  </Button>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}