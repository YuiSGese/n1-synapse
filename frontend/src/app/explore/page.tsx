'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Search, Download, ArrowLeft, Loader2, Globe, User, BookOpen, Folder } from 'lucide-react' // Đã thêm icon Folder

export default function ExplorePage() {
  const [decks, setDecks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null) 
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchPublicDecks = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        // 1. Lấy tất cả khóa học/thư mục public
        const { data, error } = await supabase
          .from('decks')
          .select('*')
          .eq('is_public', true)
          .order('downloads', { ascending: false })

        if (error) throw error

        let publicDecks = data || []

        // 2. Lọc bỏ những gì user ĐÃ DOWNLOAD
        if (user) {
            const { data: myDownloaded } = await supabase
                .from('decks')
                .select('name')
                .eq('user_id', user.id)
                .eq('is_downloaded', true)
            
            if (myDownloaded && myDownloaded.length > 0) {
                const downloadedNames = myDownloaded.map(d => d.name)
                publicDecks = publicDecks.filter(deck => !downloadedNames.includes(deck.name))
            }
        }

        setDecks(publicDecks)
      } catch (error: any) {
        toast.error("Không thể tải danh sách cộng đồng")
      } finally {
        setLoading(false)
      }
    }

    fetchPublicDecks()
  }, [supabase])

  const handleDownload = async (deckId: string) => {
    setDownloadingId(deckId)
    try {
      // Gọi Hàm SQL Đệ Quy mới tạo
      const { data: newDeckId, error } = await supabase.rpc('clone_public_deck', { 
        source_deck_id: deckId 
      })

      if (error) throw error

      toast.success("🎉 Đã tải trọn bộ về máy thành công!")
      
      const deckInfo = decks.find(d => d.id === deckId)
      // Nếu là thư mục thì về trang chủ. Nếu là bài lẻ thì vào thẳng bài đó.
      if (deckInfo?.type === 'folder') {
          router.push('/')
      } else {
          router.push(`/decks/${newDeckId}`)
      }
      
    } catch (error: any) {
      toast.error("Lỗi khi tải: " + error.message)
    } finally {
      setDownloadingId(null)
    }
  }

  const filteredDecks = decks.filter(deck => 
    deck.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deck.author_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (deck.tags && deck.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  )

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-zinc-900 flex flex-col">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="hover:bg-zinc-100">
              <ArrowLeft className="h-5 w-5 text-zinc-600" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-sm">
                <Globe className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Chợ Khóa Học</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-8">
        
        <div className="bg-zinc-900 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                <Globe className="w-96 h-96" />
            </div>
            <div className="relative z-10 max-w-2xl">
                <h2 className="text-3xl md:text-5xl font-black mb-4">Học tập cùng Cộng đồng.</h2>
                <p className="text-zinc-400 text-lg mb-8">Khám phá và tải về hàng trăm bộ từ vựng JLPT chất lượng cao do các giáo viên và người dùng khác chia sẻ.</p>
                
                <div className="relative flex items-center max-w-md">
                    <Search className="absolute left-4 h-5 w-5 text-zinc-500" />
                    <Input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm khóa học, tác giả, N1, N2..." 
                        className="h-14 pl-12 pr-4 rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-zinc-500 focus-visible:ring-blue-500 text-lg backdrop-blur-sm"
                    />
                </div>
            </div>
        </div>

        <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Thịnh hành nhất
                </h3>
                <span className="text-sm text-zinc-500 font-medium">{filteredDecks.length} kết quả</span>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
                    <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
                    <p>Đang tải dữ liệu từ cộng đồng...</p>
                </div>
            ) : filteredDecks.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-zinc-200">
                    <p className="text-zinc-500">Không tìm thấy dữ liệu nào hoặc bạn đã tải hết rồi.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDecks.map((deck) => (
                        <Card key={deck.id} className="p-6 flex flex-col bg-white border-zinc-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
                            
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex flex-wrap gap-1.5 flex-1">
                                    
                                    {/* BADGE PHÂN BIỆT THƯ MỤC & BÀI HỌC */}
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold border-blue-200 flex items-center gap-1.5 hover:bg-blue-100">
                                        {deck.type === 'folder' ? <Folder className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                                        {deck.type === 'folder' ? 'Thư mục' : 'Bài học'}
                                    </Badge>

                                    {deck.tags && deck.tags.slice(0, 2).map((tag: string, i: number) => (
                                        <Badge key={i} variant="secondary" className="bg-zinc-100 text-zinc-600 font-normal hover:bg-zinc-200">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ml-2">
                                    <Download className="h-3 w-3" />
                                    {deck.downloads || 0}
                                </div>
                            </div>

                            <h4 className="font-bold text-xl text-zinc-900 mb-2 line-clamp-2 leading-tight group-hover:text-blue-700 transition-colors">
                                {deck.name}
                            </h4>
                            <p className="text-sm text-zinc-500 mb-6 line-clamp-2 flex-1">
                                {deck.description || "Không có mô tả cho nội dung này."}
                            </p>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100">
                                <div className="flex items-center gap-2 text-sm text-zinc-600 font-medium">
                                    <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center">
                                        <User className="h-3 w-3 text-zinc-500" />
                                    </div>
                                    <span className="truncate max-w-[120px]">{deck.author_name || 'Ẩn danh'}</span>
                                </div>
                                
                                {currentUser?.id === deck.user_id ? (
                                    <span className="text-xs font-bold text-zinc-400 bg-zinc-100 px-3 py-1.5 rounded-lg">Của bạn</span>
                                ) : (
                                    <Button 
                                        onClick={() => handleDownload(deck.id)}
                                        disabled={downloadingId === deck.id}
                                        className="bg-zinc-900 hover:bg-blue-600 text-white shadow-none gap-2 rounded-xl transition-all h-9 px-4"
                                    >
                                        {downloadingId === deck.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                        Tải về
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
      </main>
    </div>
  )
}