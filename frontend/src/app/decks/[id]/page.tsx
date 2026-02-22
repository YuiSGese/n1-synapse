'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, BookOpen, Layers, PlayCircle } from 'lucide-react'
import { SmartVocabEntry } from '@/components/deck/smart-vocab-entry'
import { StoryGenerator } from '@/components/deck/story-generator'
import { ReviewManager } from '@/components/deck/review/review-manager'
import { EditableVocabRow } from '@/components/deck/editable-vocab-row' // <--- IMPORT COMPONENT EDIT MỚI
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function DeckDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [deck, setDeck] = useState<any>(null)
  const [vocabList, setVocabList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 1. Fetch thông tin Deck
  const fetchDeckInfo = useCallback(async () => {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error) {
      toast.error("Không tìm thấy bài học hoặc đã bị xóa")
      router.push('/')
      return null
    } 
    
    setDeck(data)
    return data
  }, [params.id, router, supabase])

  // 2. Fetch danh sách từ vựng
  const fetchVocab = useCallback(async () => {
    const { data } = await supabase
      .from('vocab')
      .select('*')
      .eq('deck_id', params.id)
      .order('created_at', { ascending: false })
    
    if (data) setVocabList(data)
  }, [params.id, supabase])

  // 3. Chạy cả 2 cùng lúc và đợi xong hết mới tắt Loading
  useEffect(() => {
    const initData = async () => {
      setLoading(true)
      await Promise.all([fetchDeckInfo(), fetchVocab()])
      setLoading(false)
    }
    initData()
  }, [fetchDeckInfo, fetchVocab])
  
  const handleDeleteVocab = async (id: string) => {
    if(!confirm("Xóa từ này?")) return
    await supabase.from('vocab').delete().eq('id', id)
    fetchVocab() // Reload lại danh sách sau khi xóa
    toast.success("Đã xóa")
  }

  const simpleVocabList = vocabList.map(v => v.word)

  // Nếu đang tải hoặc chưa có deck (đang redirect), hiện màn hình chờ
  if (loading || !deck) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center text-zinc-500 animate-pulse">
          Đang tải dữ liệu...
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-white text-zinc-900 font-sans flex flex-col overflow-hidden">
      
      {/* TABS CONTAINER */}
      <Tabs defaultValue="vocab" className="flex flex-col h-full">
        
        {/* HEADER */}
        <header className="h-14 border-b border-zinc-200 flex items-center px-2 md:px-4 gap-2 sticky top-0 bg-white z-20 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="shrink-0">
            <ArrowLeft className="h-5 w-5 text-zinc-500" />
          </Button>
          
          {/* TABS LIST */}
          <div className="flex-1 flex justify-center overflow-x-auto no-scrollbar">
            <TabsList className="bg-transparent p-0 gap-1 md:gap-2 h-10">
              <TabsTrigger value="vocab" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 text-zinc-500 rounded-full px-3 md:px-4 text-xs md:text-sm border border-transparent data-[state=active]:border-zinc-200 shadow-none">
                <Layers className="h-3.5 w-3.5 mr-1.5" /> Danh sách
              </TabsTrigger>
              <TabsTrigger value="review" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white text-zinc-500 rounded-full px-3 md:px-4 text-xs md:text-sm border border-transparent shadow-none">
                <PlayCircle className="h-3.5 w-3.5 mr-1.5" /> Ôn tập
              </TabsTrigger>
              <TabsTrigger value="story" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 text-zinc-500 rounded-full px-3 md:px-4 text-xs md:text-sm border border-transparent data-[state=active]:border-purple-100 shadow-none">
                <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Cốt truyện
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="w-8 shrink-0"></div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto bg-white scroll-smooth">
          
          {/* TAB 1: DANH SÁCH */}
          <TabsContent value="vocab" className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 mt-0 h-full">
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-bold">{deck.name}</h2>
                <Badge variant="outline" className="text-zinc-500 font-normal">{deck.type}</Badge>
                <span className="text-xs text-zinc-400">({vocabList.length} từ)</span>
            </div>

            <SmartVocabEntry deckId={params.id as string} onAdded={fetchVocab} />
            
            {/* THAY THẾ TABLE CŨ BẰNG EDITABLE ROW MỚI */}
            <div className="border border-zinc-200 rounded-lg overflow-hidden shadow-sm bg-white">
                {/* Header của danh sách */}
                <div className="flex items-center p-4 py-3 border-b border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    <div className="w-1/3">Từ vựng</div>
                    <div className="w-2/3 pl-1">Nghĩa</div>
                </div>

                {/* Danh sách từ vựng */}
                <div>
                    {vocabList.length === 0 ? (
                        <div className="text-center py-10 text-zinc-400 italic text-sm">Chưa có từ vựng nào trong bài học này.</div>
                    ) : (
                        vocabList.map((vocab) => (
                            <EditableVocabRow 
                                key={vocab.id} 
                                vocab={vocab} 
                                onDelete={handleDeleteVocab} 
                                onUpdated={fetchVocab} 
                            />
                        ))
                    )}
                </div>
            </div>
          </TabsContent>

          {/* TAB 2: REVIEW */}
          <TabsContent value="review" className="h-full mt-0">
            <div className="h-full w-full p-0 md:p-6 md:max-w-4xl md:mx-auto flex flex-col justify-center">
              <ReviewManager vocabList={vocabList} />
            </div>
          </TabsContent>

          {/* TAB 3: STORY */}
          <TabsContent value="story" className="p-4 md:p-6 max-w-3xl mx-auto mt-0 h-full">
            <StoryGenerator vocabList={simpleVocabList} />
          </TabsContent>

        </main>
      </Tabs>
    </div>
  )
}