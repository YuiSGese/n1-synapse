'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Trophy, Swords, Target, Search, Type, CheckCircle2 } from 'lucide-react'
import { TestSession } from './test-session' // <--- 1. IMPORT COMPONENT MỚI
import { cn } from '@/lib/utils' // <--- THÊM DÒNG IMPORT NÀY VÀO ĐÂY

interface TestManagerProps {
  deck: any
  vocabList: any[]
  onUpdated: () => void
}

export function TestManager({ deck, vocabList, onUpdated }: TestManagerProps) {
  const [isTesting, setIsTesting] = useState(false)
  const [batchSize, setBatchSize] = useState<number | 'all'>(10) // <--- THÊM STATE NÀY ĐỂ LƯU LỰA CHỌN (Mặc định 10)

  // Tính toán số lượng từ ở mỗi cấp độ Mastery (0, 1, 2, 3)
  const totalWords = vocabList.length
  const level0 = vocabList.filter(v => (v.mastery_level || 0) === 0).length
  const level1 = vocabList.filter(v => v.mastery_level === 1).length
  const level2 = vocabList.filter(v => v.mastery_level === 2).length
  const level3 = vocabList.filter(v => v.mastery_level === 3).length

  // Tính toán % tiến độ chính xác theo công thức mới
  const progressPercent = totalWords > 0 
    ? Math.round((vocabList.reduce((acc, v) => acc + (v.mastery_level || 0), 0) / (totalWords * 3)) * 100)
    : 0

  const handleStartTest = () => {
    if (totalWords === 0) return
    setIsTesting(true)
  }

  // 2. RENDER TEST SESSION KHI BẤM BẮT ĐẦU
  if (isTesting) {
    return (
      <TestSession 
        vocabList={vocabList} 
        batchSize={batchSize} // <--- TRUYỀN BIẾN NÀY XUỐNG TEST SESSION
        onExit={() => {
          setIsTesting(false)
          onUpdated() // Fetch lại dữ liệu để cập nhật % tiến độ và biểu đồ
        }} 
      />
    )
  }

  // Màn hình Phân tích & Chờ
  return (
    <div className="h-full max-w-3xl mx-auto py-6 px-4 md:px-0 flex flex-col gap-8 animate-in fade-in duration-500">
      
      {/* Vòng tròn & Thanh Progress Tổng */}
      <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4 relative">
          <svg className="w-full h-full transform -rotate-90 absolute inset-0">
            <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-blue-100" />
            <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" 
              strokeDasharray={276} strokeDashoffset={276 - (276 * progressPercent) / 100} 
              className="text-blue-600 transition-all duration-1000 ease-out" 
            />
          </svg>
          <Trophy className={`w-10 h-10 ${progressPercent === 100 ? 'text-yellow-500' : 'text-blue-500'}`} />
        </div>
        <h2 className="text-3xl font-black text-zinc-900 mb-2">{progressPercent}% Hoàn thành</h2>
        <p className="text-zinc-500 text-sm max-w-md mb-6">
          Hoàn thành các bài Test để tăng điểm thông thạo cho từng từ vựng. Đạt 100% để qua bài mới.
        </p>

        {/* THÊM BỘ CHỌN SỐ LƯỢNG CÂU HỎI TẠI ĐÂY */}
        {totalWords > 0 && progressPercent < 100 && (
          <div className="flex flex-col items-center gap-3 mb-2 animate-in fade-in zoom-in-95 duration-300">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Chọn số từ vựng cho 1 lượt Test</span>
            <div className="flex items-center gap-1 bg-zinc-50/80 p-1.5 rounded-2xl border border-zinc-200">
              {[5, 10, 15, 'all'].map((size) => (
                <button
                  key={size}
                  onClick={() => setBatchSize(size as number | 'all')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200",
                    batchSize === size 
                      ? "bg-white text-blue-600 shadow-sm border border-zinc-200" 
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                  )}
                >
                  {size === 'all' ? 'Tất cả' : size}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button 
          onClick={handleStartTest} 
          disabled={totalWords === 0 || progressPercent === 100}
          className="mt-4 bg-zinc-900 hover:bg-blue-600 text-white shadow-xl shadow-blue-500/20 rounded-full px-8 h-14 text-lg font-bold transition-all"
        >
          {totalWords === 0 ? "Chưa có từ vựng" : progressPercent === 100 ? "Đã thông thạo toàn bộ" : "Bắt đầu làm bài"}
          <Swords className="w-5 h-5 ml-2" />
        </Button>
      </div>

      {/* Phân tích Level */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <LevelCard 
          icon={<Search className="w-5 h-5" />} 
          title="Mới học" 
          desc="Trắc nghiệm"
          count={level0} 
          color="text-zinc-500 bg-zinc-100 border-zinc-200" 
        />
        <LevelCard 
          icon={<Target className="w-5 h-5" />} 
          title="Nhận biết" 
          desc="Nối từ"
          count={level1} 
          color="text-orange-600 bg-orange-50 border-orange-200" 
        />
        <LevelCard 
          icon={<Type className="w-5 h-5" />} 
          title="Ghi nhớ" 
          desc="Gõ từ"
          count={level2} 
          color="text-blue-600 bg-blue-50 border-blue-200" 
        />
        <LevelCard 
          icon={<CheckCircle2 className="w-5 h-5" />} 
          title="Thông thạo" 
          desc="Mastery"
          count={level3} 
          color="text-green-600 bg-green-50 border-green-200" 
        />
      </div>
    </div>
  )
}

function LevelCard({ icon, title, desc, count, color }: any) {
  return (
    <div className={`p-4 rounded-2xl border flex flex-col items-center text-center ${color}`}>
      <div className="mb-2 opacity-80">{icon}</div>
      <div className="text-3xl font-black mb-1">{count}</div>
      <div className="text-xs font-bold uppercase tracking-wider opacity-80">{title}</div>
      <div className="text-[10px] opacity-60 mt-1">{desc}</div>
    </div>
  )
}