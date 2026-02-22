'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Pencil, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function EditableVocabRow({ vocab, onDelete, onUpdated }: any) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // States cho form edit
  const [word, setWord] = useState(vocab.word)
  const [kanjiMeaning, setKanjiMeaning] = useState(vocab.kanji_meaning || '')
  const [reading, setReading] = useState(vocab.reading || '')
  const [meaning, setMeaning] = useState(vocab.meaning || '')
  
  // Ví dụ (Xử lý an toàn mảng JSON)
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

      toast.success("Đã cập nhật!")
      setIsEditing(false)
      onUpdated() // Gọi lên cha để fetch lại data
    } catch (error) {
      toast.error("Lỗi khi cập nhật")
    } finally {
      setLoading(false)
    }
  }

  // NẾU ĐANG Ở TRẠNG THÁI SỬA (Mở rộng toàn bộ)
  if (isEditing) {
    return (
      <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4 mb-3 shadow-sm animate-in fade-in zoom-in-95">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
          <Input className="md:col-span-3 font-bold bg-white" value={word} onChange={e => setWord(e.target.value)} placeholder="Từ vựng" />
          <Input className="md:col-span-3 bg-white uppercase text-xs font-bold" value={kanjiMeaning} onChange={e => setKanjiMeaning(e.target.value)} placeholder="Âm Hán Việt" />
          <Input className="md:col-span-3 bg-white text-blue-700" value={reading} onChange={e => setReading(e.target.value)} placeholder="Cách đọc" />
          <Input className="md:col-span-3 bg-white" value={meaning} onChange={e => setMeaning(e.target.value)} placeholder="Nghĩa TV" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <Textarea className="bg-white h-[60px]" value={example} onChange={e => setExample(e.target.value)} placeholder="Ví dụ 1..." />
          <Textarea className="bg-white h-[60px]" value={exampleMeaning} onChange={e => setExampleMeaning(e.target.value)} placeholder="Dịch ví dụ 1..." />
          <Textarea className="bg-white h-[60px]" value={example2} onChange={e => setExample2(e.target.value)} placeholder="Ví dụ 2..." />
          <Textarea className="bg-white h-[60px]" value={exampleMeaning2} onChange={e => setExampleMeaning2(e.target.value)} placeholder="Dịch ví dụ 2..." />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsEditing(false)}>Hủy</Button>
          <Button onClick={handleUpdate} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
            Lưu thay đổi
          </Button>
        </div>
      </div>
    )
  }

  // NẾU Ở TRẠNG THÁI XEM (Thu gọn thành 1 dòng)
  return (
    <div className="flex items-center justify-between p-3 border-b border-zinc-100 hover:bg-zinc-50 group transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-1/4">
          <span className="font-bold text-lg text-zinc-900">{vocab.word}</span>
          {vocab.kanji_meaning && (
            <span className="ml-2 text-[10px] uppercase tracking-widest text-zinc-400 font-bold border border-zinc-200 px-1 rounded bg-white">
              {vocab.kanji_meaning}
            </span>
          )}
        </div>
        <div className="w-1/4 text-sm text-blue-600 font-medium">{vocab.reading}</div>
        <div className="w-2/4 text-sm text-zinc-700 truncate">{vocab.meaning}</div>
      </div>
      
      {/* Nút hành động: Chỉ hiện khi Hover */}
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
          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title="Xóa"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}