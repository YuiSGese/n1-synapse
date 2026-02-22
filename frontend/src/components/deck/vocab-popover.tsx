'use client'

import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Loader2, BookOpen, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

interface VocabPopoverProps {
  word: string
  children: React.ReactNode
  isTarget?: boolean // Nếu là từ vựng mục tiêu (in đậm)
}

export function VocabPopover({ word, children, isTarget }: VocabPopoverProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState(false)

  // Hàm gọi API tách riêng để có thể tái sử dụng cho nút Retry
  const fetchData = async () => {
    setLoading(true)
    setError(false)
    setData(null)
    
    try {
      const res = await fetch(`${API_URL}/api/nlp/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word })
      })
      
      if (!res.ok) throw new Error("Lỗi mạng")
      
      const result = await res.json()
      
      // Kiểm tra nếu Backend trả về thông báo lỗi trong field meaning
      if (result.meaning && (result.meaning.includes("Lỗi") || result.meaning.includes("Error"))) {
         throw new Error(result.meaning)
      }

      setData(result)
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen)
    // Chỉ gọi API khi mở ra lần đầu và chưa có dữ liệu
    if (isOpen && !data && !loading && !error) {
      await fetchData()
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        {/* Phần tử kích hoạt (chữ trong câu chuyện) */}
        <span 
          className={`
            cursor-pointer transition-all duration-200 inline-block
            ${isTarget 
              ? '' // Style cho target word đã được xử lý ở ngoài
              : 'hover:bg-blue-100 hover:text-blue-800 rounded px-0.5 mx-0.5' // Style cho từ thường
            }
          `}
          onClick={(e) => e.stopPropagation()} // Ngăn click lan ra ngoài làm ẩn dòng dịch
        >
          {children}
        </span>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0 overflow-hidden border-zinc-200 shadow-xl z-50" side="top">
        {/* Header - Đã cập nhật hiển thị Âm Hán Việt */}
        <div className={`px-4 py-3 border-b flex items-start justify-between ${isTarget ? 'bg-purple-50 border-purple-100' : 'bg-zinc-50 border-zinc-100'}`}>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-lg text-zinc-800 leading-none">{word}</h4>
              {/* Hiển thị Âm Hán Việt nếu có */}
              {data?.kanji_meaning && (
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold border border-zinc-200 px-1.5 py-0.5 rounded bg-white leading-none">
                  {data.kanji_meaning}
                </span>
              )}
            </div>
            {/* Cách đọc Hiragana */}
            {data?.reading && <span className="text-sm text-blue-600 font-medium">{data.reading}</span>}
          </div>
          {isTarget && <span className="text-[10px] uppercase font-bold bg-purple-200 text-purple-700 px-2 py-0.5 rounded mt-0.5">Target</span>}
        </div>
        
        {/* Body */}
        <div className="p-4 bg-white min-h-[120px] flex flex-col justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-300" />
              <span className="text-xs">AI đang tra cứu...</span>
            </div>
          ) : error ? (
            // GIAO DIỆN LỖI & NÚT THỬ LẠI
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <div className="text-red-500 flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="h-4 w-4" />
                Không tải được dữ liệu
              </div>
              <Button size="sm" variant="outline" onClick={fetchData} className="gap-2 h-8 text-xs border-red-200 hover:bg-red-50 hover:text-red-600">
                <RefreshCw className="h-3 w-3" />
                Thử lại ngay
              </Button>
            </div>
          ) : data ? (
            // GIAO DIỆN HIỂN THỊ DỮ LIỆU
            <div className="space-y-3">
              {/* Nghĩa */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-3 w-3 text-zinc-400" />
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nghĩa</span>
                  {data.part_of_speech && <span className="text-[10px] px-1.5 py-0.5 bg-zinc-100 rounded text-zinc-500 border border-zinc-200">{data.part_of_speech}</span>}
                </div>
                <p className="text-zinc-800 font-medium text-base">{data.meaning}</p>
              </div>
              
              {/* Ví dụ 1 */}
              {data.example_sentence && (
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 mt-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Ví dụ 1</span>
                  <p className="text-sm text-zinc-700 mb-1 leading-relaxed">{data.example_sentence}</p>
                  <p className="text-xs text-zinc-500 italic border-t border-zinc-200 pt-1 mt-1">{data.example_translation}</p>
                </div>
              )}

              {/* Ví dụ 2 (Nếu AI trả về) */}
              {data.example_sentence_2 && (
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 mt-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Ví dụ 2</span>
                  <p className="text-sm text-zinc-700 mb-1 leading-relaxed">{data.example_sentence_2}</p>
                  <p className="text-xs text-zinc-500 italic border-t border-zinc-200 pt-1 mt-1">{data.example_translation_2}</p>
                </div>
              )}
            </div>
          ) : (
            // TRƯỜNG HỢP RỖNG (Cũng cho nút thử lại)
            <div className="flex flex-col items-center justify-center gap-2">
                <p className="text-sm text-zinc-400">Chưa có dữ liệu.</p>
                 <Button size="sm" variant="ghost" onClick={fetchData} className="gap-2 h-8 text-xs text-zinc-500">
                    <RefreshCw className="h-3 w-3" /> Tra cứu lại
                </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}