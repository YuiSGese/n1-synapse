'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LayoutTemplate, GraduationCap, Play } from 'lucide-react'

interface ModeSelectorProps {
  onSelect: (mode: 'flashcard' | 'quiz') => void
}

export function ModeSelector({ onSelect }: ModeSelectorProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-zinc-800">Chọn chế độ ôn tập</h2>
        <p className="text-zinc-500">Hôm nay bạn muốn học theo cách nào?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Flashcard Option */}
        <Card 
          className="group relative overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border-zinc-200 hover:border-zinc-900"
          onClick={() => onSelect('flashcard')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-zinc-100 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="p-8 flex flex-col items-center text-center relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <LayoutTemplate className="w-8 h-8 text-zinc-700" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Flashcard</h3>
            {/* <p className="text-sm text-zinc-500 leading-relaxed mb-6">
              Lật thẻ truyền thống. Xem mặt trước, đoán mặt sau. Tốt cho việc ghi nhớ ban đầu.
            </p> */}
            <Button className="w-full bg-zinc-900 text-white hover:bg-zinc-800 group-hover:translate-y-0 translate-y-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
              Bắt đầu <Play className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>

        {/* Quiz Option */}
        <Card 
          className="group relative overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border-zinc-200 hover:border-blue-600"
          onClick={() => onSelect('quiz')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-8 flex flex-col items-center text-center relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <GraduationCap className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2 group-hover:text-blue-700">Quiz Game</h3>
            {/* <p className="text-sm text-zinc-500 leading-relaxed mb-6 group-hover:text-blue-600/80">
              Kiểm tra kiến thức qua các bài tập: Trắc nghiệm, Gõ từ, Nối thẻ... Tính điểm SRS.
            </p> */}
            <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 group-hover:translate-y-0 translate-y-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
              Bắt đầu <Play className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}