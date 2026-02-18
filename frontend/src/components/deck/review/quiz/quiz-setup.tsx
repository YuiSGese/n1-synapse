'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, BookA, Keyboard, MousePointerClick, Shuffle, Type } from 'lucide-react'
import { cn } from '@/lib/utils'

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
      desc: 'Xem Kanji, chọn nghĩa tiếng Việt đúng.',
      icon: BookA,
      color: 'bg-green-100 text-green-600',
      border: 'hover:border-green-500'
    },
    {
      id: 'reading',
      title: 'Chọn Cách Đọc',
      desc: 'Xem Kanji, chọn Hiragana đúng (hoặc ngược lại).',
      icon: Type,
      color: 'bg-blue-100 text-blue-600',
      border: 'hover:border-blue-500'
    },
    {
      id: 'matching',
      title: 'Nối Từ (Matching)',
      desc: 'Game lật thẻ bài. Tìm các cặp tương ứng.',
      icon: MousePointerClick,
      color: 'bg-purple-100 text-purple-600',
      border: 'hover:border-purple-500'
    },
    {
      id: 'typing',
      title: 'Gõ Từ (Typing)',
      desc: 'Nhập cách đọc Hiragana từ bàn phím.',
      icon: Keyboard,
      color: 'bg-orange-100 text-orange-600',
      border: 'hover:border-orange-500'
    },
    {
      id: 'mixed',
      title: 'Hỗn Hợp (Mixed)',
      desc: 'Trộn lẫn tất cả các dạng bài trên.',
      icon: Shuffle,
      color: 'bg-zinc-100 text-zinc-600',
      border: 'hover:border-zinc-500'
    }
  ]

  return (
    <div className="h-full flex flex-col p-4 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300 overflow-y-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-zinc-500" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-zinc-800">Chọn dạng bài tập</h2>
          <p className="text-zinc-500 text-sm">Bạn muốn kiểm tra kiến thức theo cách nào?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modes.map((mode) => {
          const Icon = mode.icon
          return (
            <Card 
              key={mode.id}
              className={cn(
                "p-6 cursor-pointer border-2 transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden group",
                `border-zinc-100 ${mode.border}`
              )}
              onClick={() => onStart(mode.id as QuizMode)}
            >
              {/* Header: Icon + Title nằm ngang */}
              <div className="flex items-center gap-4 mb-3">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", mode.color)}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-zinc-800 text-lg">{mode.title}</h3>
              </div>

              <p className="text-sm text-zinc-500 leading-relaxed">{mode.desc}</p>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
