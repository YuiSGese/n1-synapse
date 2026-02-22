'use client'

import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

interface SmartVocabEntryProps {
  deckId: string
  onAdded: () => void
}

export function SmartVocabEntry({ deckId, onAdded }: SmartVocabEntryProps) {
  const [loading, setLoading] = useState(false)
  
  // Dòng 1
  const [word, setWord] = useState('')
  const [kanjiMeaning, setKanjiMeaning] = useState('') // Âm Hán Việt
  const [reading, setReading] = useState('')
  const [meaning, setMeaning] = useState('')
  const [partOfSpeech, setPartOfSpeech] = useState('')

  // Dòng 2 & 3 (Ví dụ)
  const [example, setExample] = useState('')
  const [exampleMeaning, setExampleMeaning] = useState('')
  const [example2, setExample2] = useState('')
  const [exampleMeaning2, setExampleMeaning2] = useState('')

  const supabase = createClient()
  const wordInputRef = useRef<HTMLInputElement>(null)

  const handleAutoFill = async () => {
    const trimmedWord = word.trim()
    if (!trimmedWord) return
    
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/nlp/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: trimmedWord })
      })

      if (!res.ok) throw new Error("Lỗi kết nối Server Python")
      const data = await res.json()

      // Làm sạch cách đọc (xóa phần Romaji trong ngoặc nếu AI lỡ sinh ra)
      // VD: "ほうこく (houkoku)" -> "ほうこく"
      const rawReading = data.reading || ''
      const cleanReading = rawReading.split('(')[0].trim()
      setReading(cleanReading)

      setMeaning(data.meaning || '')
      // Nhận Âm Hán Việt từ AI
      if (data.kanji_meaning) setKanjiMeaning(data.kanji_meaning)
      
      setExample(data.example_sentence || '')
      setExampleMeaning(data.example_translation || '')
      
      // Nhận Ví dụ 2 từ AI
      setExample2(data.example_sentence_2 || '')
      setExampleMeaning2(data.example_translation_2 || '')
      
      setPartOfSpeech(data.part_of_speech || '')
      
      toast.success("AI đã tìm thấy: " + trimmedWord)
    } catch (error) {
      console.error(error)
      toast.error("Không thể tra từ này")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!word.trim()) return toast.error("Chưa nhập từ vựng")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Gom 2 ví dụ thành mảng JSON
      const examplesArray = []
      if (example.trim()) examplesArray.push({ sentence: example, translation: exampleMeaning })
      if (example2.trim()) examplesArray.push({ sentence: example2, translation: exampleMeaning2 })

      const { error } = await supabase.from('vocab').insert({
        user_id: user.id,
        deck_id: deckId,
        word: word,
        reading: reading,
        kanji_meaning: kanjiMeaning, // Lưu âm Hán
        meaning: meaning,
        part_of_speech: partOfSpeech,
        examples: examplesArray // Lưu mảng 2 ví dụ
      })

      if (error) throw error

      toast.success("Đã thêm từ: " + word)
      
      // Reset
      setWord(''); setKanjiMeaning(''); setReading(''); setMeaning('');
      setExample(''); setExampleMeaning(''); setExample2(''); setExampleMeaning2('');
      setPartOfSpeech('')
      
      onAdded() 
      wordInputRef.current?.focus()

    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Thêm từ vựng mới</h3>
        </div>
        {loading && <span className="text-xs text-purple-600 animate-pulse">Đang hỏi AI...</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-5 items-start">
        {/* === DÒNG 1: Từ vựng | Âm Hán | Cách đọc | Nghĩa === */}
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
            <button 
              onClick={handleAutoFill}
              className="absolute right-2 top-2.5 text-zinc-400 hover:text-purple-600 transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="md:col-span-3 space-y-1.5">
          <Label className="text-xs text-zinc-500">Âm Hán Việt</Label>
          <Input 
            value={kanjiMeaning} 
            onChange={(e) => setKanjiMeaning(e.target.value)} 
            className="bg-white uppercase text-xs font-bold tracking-widest text-zinc-600" 
            placeholder="ÂM HÁN VIỆT"
          />
        </div>

        <div className="md:col-span-3 space-y-1.5">
          <Label className="text-xs text-zinc-500">Cách đọc</Label>
          <Input 
            value={reading} 
            onChange={(e) => setReading(e.target.value)} 
            className="bg-white font-medium text-blue-700" 
            placeholder="Hiragana"
          />
        </div>

        <div className="md:col-span-3 space-y-1.5">
          <Label className="text-xs text-zinc-500">Nghĩa tiếng Việt</Label>
          <Input 
            value={meaning} 
            onChange={(e) => setMeaning(e.target.value)} 
            className="bg-white" 
            placeholder="Nghĩa..."
          />
        </div>

        {/* === DÒNG 2: Ví dụ 1 === */}
        <div className="md:col-span-6 space-y-1.5">
          <Label className="text-xs text-zinc-500">Ví dụ 1</Label>
          <Textarea 
            value={example} 
            onChange={(e) => setExample(e.target.value)} 
            className="bg-white h-[60px] min-h-[60px] resize-none py-2 text-sm" 
            placeholder="Ví dụ tiếng Nhật 1..."
          />
        </div>

        <div className="md:col-span-6 space-y-1.5">
          <Label className="text-xs text-zinc-500">Dịch nghĩa 1</Label>
          <Textarea 
            value={exampleMeaning} 
            onChange={(e) => setExampleMeaning(e.target.value)} 
            className="bg-white h-[60px] min-h-[60px] resize-none py-2 text-sm" 
            placeholder="Dịch nghĩa 1..."
          />
        </div>

        {/* === DÒNG 3: Ví dụ 2 & Nút Lưu === */}
        <div className="md:col-span-6 space-y-1.5">
          <Label className="text-xs text-zinc-500">Ví dụ 2</Label>
          <Textarea 
            value={example2} 
            onChange={(e) => setExample2(e.target.value)} 
            className="bg-white h-[60px] min-h-[60px] resize-none py-2 text-sm" 
            placeholder="Ví dụ tiếng Nhật 2..."
          />
        </div>

        <div className="md:col-span-5 space-y-1.5">
          <Label className="text-xs text-zinc-500">Dịch nghĩa 2</Label>
          <Textarea 
            value={exampleMeaning2} 
            onChange={(e) => setExampleMeaning2(e.target.value)} 
            className="bg-white h-[60px] min-h-[60px] resize-none py-2 text-sm" 
            placeholder="Dịch nghĩa 2..."
          />
        </div>

        <div className="md:col-span-1 pt-6 flex justify-end h-full">
          <Button onClick={handleSave} className="bg-zinc-900 hover:bg-zinc-700 h-full w-full min-h-[60px]">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}