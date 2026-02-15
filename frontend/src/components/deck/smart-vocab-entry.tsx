'use client'

import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

// Địa chỉ backend Python (Chạy ở port 8000)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

interface SmartVocabEntryProps {
  deckId: string
  onAdded: () => void
}

export function SmartVocabEntry({ deckId, onAdded }: SmartVocabEntryProps) {
  const [loading, setLoading] = useState(false)
  const [word, setWord] = useState('')
  
  // Các trường dữ liệu
  const [reading, setReading] = useState('')
  const [meaning, setMeaning] = useState('')
  const [example, setExample] = useState('')
  const [exampleMeaning, setExampleMeaning] = useState('') // Thêm trường dịch ví dụ
  const [partOfSpeech, setPartOfSpeech] = useState('')

  const supabase = createClient()
  const wordInputRef = useRef<HTMLInputElement>(null)

  // 1. Gọi API Python để AI điền tự động
  const handleAutoFill = async () => {
    const trimmedWord = word.trim()
    if (!trimmedWord) return
    
    setLoading(true)
    try {
      // Gọi sang Backend Python
      const res = await fetch(`${API_URL}/api/nlp/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: trimmedWord })
      })

      if (!res.ok) throw new Error("Lỗi kết nối Server Python")

      const data = await res.json()

      // Điền dữ liệu trả về vào Form
      setReading(data.reading || '')
      setMeaning(data.meaning || '')
      setExample(data.example_sentence || '')
      setExampleMeaning(data.example_translation || '')
      setPartOfSpeech(data.part_of_speech || '')
      
      toast.success("AI đã tìm thấy: " + trimmedWord)

    } catch (error) {
      console.error(error)
      toast.error("Không thể tra từ này (Kiểm tra lại Backend Python)")
    } finally {
      setLoading(false)
    }
  }

  // 2. Lưu vào Database Supabase
  const handleSave = async () => {
    if (!word.trim()) return toast.error("Chưa nhập từ vựng")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('vocab').insert({
        user_id: user.id,
        deck_id: deckId,
        word: word,
        reading: reading,
        meaning: meaning,
        part_of_speech: partOfSpeech,
        // Lưu cấu trúc JSON chuẩn
        examples: [{ sentence: example, translation: exampleMeaning }] 
      })

      if (error) throw error

      toast.success("Đã thêm từ: " + word)
      
      // Reset form
      setWord('')
      setReading('')
      setMeaning('')
      setExample('')
      setExampleMeaning('')
      setPartOfSpeech('')
      
      onAdded() 
      wordInputRef.current?.focus()

    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Thêm từ vựng</h3>
        </div>
        {loading && <span className="text-xs text-purple-600 animate-pulse">Đang hỏi Gemini...</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Ô nhập từ chính */}
        <div className="md:col-span-3 space-y-1.5">
          <Label className="text-xs text-zinc-500 font-semibold">Từ vựng</Label>
          <div className="relative">
            <Input 
              ref={wordInputRef}
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAutoFill()}
              placeholder="Nhập từ..."
              className="font-bold text-lg border-zinc-300 focus-visible:ring-zinc-900 pr-8"
            />
            {/* Nút nhỏ để kích hoạt lại AI nếu muốn */}
            <button 
              onClick={handleAutoFill}
              className="absolute right-2 top-2.5 text-zinc-400 hover:text-purple-600 transition-colors"
              title="Tra cứu lại"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Các ô AI điền */}
        <div className="md:col-span-3 space-y-1.5">
          <Label className="text-xs text-zinc-500">Cách đọc</Label>
          <Input 
            value={reading} 
            onChange={(e) => setReading(e.target.value)} 
            className="bg-white font-medium" 
            placeholder="Hiragana"
          />
        </div>

        <div className="md:col-span-6 space-y-1.5">
          <Label className="text-xs text-zinc-500">Nghĩa tiếng Việt</Label>
          <Input 
            value={meaning} 
            onChange={(e) => setMeaning(e.target.value)} 
            className="bg-white" 
            placeholder="Nghĩa..."
          />
        </div>

        <div className="md:col-span-6 space-y-1.5">
          <Label className="text-xs text-zinc-500">Câu ví dụ (Nhật)</Label>
          <Textarea 
            value={example} 
            onChange={(e) => setExample(e.target.value)} 
            className="bg-white h-[60px] min-h-[60px] resize-none py-2 text-sm" 
            placeholder="Ví dụ tiếng Nhật..."
          />
        </div>

        <div className="md:col-span-5 space-y-1.5">
          <Label className="text-xs text-zinc-500">Dịch nghĩa ví dụ (Việt)</Label>
          <Textarea 
            value={exampleMeaning} 
            onChange={(e) => setExampleMeaning(e.target.value)} 
            className="bg-white h-[60px] min-h-[60px] resize-none py-2 text-sm" 
            placeholder="Dịch nghĩa..."
          />
        </div>

        {/* Nút Save */}
        <div className="md:col-span-1 pt-7 flex justify-end">
          <Button size="icon" onClick={handleSave} className="bg-zinc-900 hover:bg-zinc-700 h-10 w-10">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}