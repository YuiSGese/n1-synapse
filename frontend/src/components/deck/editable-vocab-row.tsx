'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Pencil, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'

// THÊM isReadOnly VÀO PROPS
export function EditableVocabRow({ vocab, onDelete, onUpdated, isReadOnly = false }: any) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // States cho form edit
  const [word, setWord] = useState(vocab.word || '')
  const [kanjiMeaning, setKanjiMeaning] = useState(vocab.kanji_meaning || '')
  const [reading, setReading] = useState(vocab.reading || '')
  const [meaning, setMeaning] = useState(vocab.meaning || '')
  
  // Lấy dữ liệu ví dụ (an toàn cho mảng JSON)
  const ex1 = vocab.examples?.[0] || { sentence: '', translation: '' }
  const ex2 = vocab.examples?.[1] || { sentence: '', translation: '' }
  
  const [example, setExample] = useState(ex1.sentence)
  const [exampleMeaning, setExampleMeaning] = useState(ex1.translation)
  const [example2, setExample2] = useState(ex2.sentence)
  const [exampleMeaning2, setExampleMeaning2] = useState(ex2.translation)

  const supabase = createClient()

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const examplesArray = []
      if (example.trim()) examplesArray.push({ sentence: example, translation: exampleMeaning })
      if (example2.trim()) examplesArray.push({ sentence: example2, translation: exampleMeaning2 })

      const { error } = await supabase.from('vocab').update({
        word,
        kanji_meaning: kanjiMeaning,
        reading,
        meaning,
        examples: examplesArray
      }).eq('id', vocab.id)

      if (error) throw error

      toast.success("Đã cập nhật từ vựng!")
      setIsEditing(false)
      onUpdated() // Fetch lại data từ component cha
    } catch (error) {
      toast.error("Lỗi khi cập nhật")
    } finally {
      setLoading(false)
    }
  }

  // --- GIAO DIỆN KHI ĐANG SỬA (MỞ RỘNG) ---
  if (isEditing) {
    return (
      <div className="bg-blue-50/40 border border-blue-200 rounded-lg p-5 mb-4 shadow-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 mb-4">
          <Pencil className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Sửa từ vựng</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-4 mb-4">
          <div className="md:col-span-3 space-y-1">
            <Label className="text-xs text-zinc-500">Từ vựng</Label>
            <Input className="font-bold bg-white" value={word} onChange={e => setWord(e.target.value)} placeholder="Từ vựng" />
          </div>
          <div className="md:col-span-3 space-y-1">
            <Label className="text-xs text-zinc-500">Âm Hán Việt</Label>
            <Input className="bg-white uppercase text-xs font-bold" value={kanjiMeaning} onChange={e => setKanjiMeaning(e.target.value)} placeholder="Âm Hán Việt" />
          </div>
          <div className="md:col-span-3 space-y-1">
            <Label className="text-xs text-zinc-500">Cách đọc</Label>
            <Input className="bg-white text-blue-700" value={reading} onChange={e => setReading(e.target.value)} placeholder="Cách đọc" />
          </div>
          <div className="md:col-span-3 space-y-1">
            <Label className="text-xs text-zinc-500">Nghĩa TV</Label>
            <Input className="bg-white" value={meaning} onChange={e => setMeaning(e.target.value)} placeholder="Nghĩa TV" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 mb-4">
          <div className="space-y-1">
             <Label className="text-xs text-zinc-500">Ví dụ 1 (Nhật)</Label>
             <Textarea className="bg-white h-[60px] resize-none" value={example} onChange={e => setExample(e.target.value)} placeholder="Ví dụ 1..." />
          </div>
          <div className="space-y-1">
             <Label className="text-xs text-zinc-500">Dịch nghĩa 1 (Việt)</Label>
             <Textarea className="bg-white h-[60px] resize-none" value={exampleMeaning} onChange={e => setExampleMeaning(e.target.value)} placeholder="Dịch ví dụ 1..." />
          </div>
          <div className="space-y-1">
             <Label className="text-xs text-zinc-500">Ví dụ 2 (Nhật)</Label>
             <Textarea className="bg-white h-[60px] resize-none" value={example2} onChange={e => setExample2(e.target.value)} placeholder="Ví dụ 2..." />
          </div>
          <div className="space-y-1">
             <Label className="text-xs text-zinc-500">Dịch nghĩa 2 (Việt)</Label>
             <Textarea className="bg-white h-[60px] resize-none" value={exampleMeaning2} onChange={e => setExampleMeaning2(e.target.value)} placeholder="Dịch ví dụ 2..." />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-blue-100">
          <Button variant="ghost" onClick={() => setIsEditing(false)} className="hover:bg-blue-100 text-blue-800">Hủy</Button>
          <Button onClick={handleUpdate} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
            Lưu thay đổi
          </Button>
        </div>
      </div>
    )
  }

  // --- GIAO DIỆN KHI XEM DANH SÁCH (THU GỌN) ---
  return (
    <div className="flex items-center justify-between p-4 py-5 border-b border-zinc-100 hover:bg-zinc-50 group transition-colors bg-white">
      <div className="flex items-start gap-4 flex-1">
        {/* Cột 1: Từ vựng + Âm Hán + Cách đọc */}
        <div className="w-1/3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-zinc-900 leading-none">{vocab.word}</span>
            {vocab.kanji_meaning && (
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold border border-zinc-200 px-1.5 py-0.5 rounded bg-white leading-none">
                {vocab.kanji_meaning}
              </span>
            )}
          </div>
          <span className="text-sm text-blue-600 font-medium">{vocab.reading}</span>
        </div>
        
        {/* Cột 2: Nghĩa tiếng Việt */}
        <div className="w-2/3 text-sm text-zinc-700 pt-0.5 pr-4">
          {vocab.meaning}
        </div>
      </div>
      
      {/* Cột 3: Nút hành động (Chỉ hiện rõ khi hover vào dòng và KHÔNG READONLY) */}
      {!isReadOnly && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setIsEditing(true)}
              className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Sửa từ này"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button 
              onClick={() => onDelete(vocab.id)}
              className="p-2 text-zinc-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Xóa"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
      )}
    </div>
  )
}