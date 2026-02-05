'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Settings, LogOut, User, Folder, ChevronRight, Home as HomeIcon, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreateDeckDialog } from '@/components/dashboard/create-deck-dialog'
import { cn } from "@/lib/utils"

type Deck = {
  id: string
  name: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  type: string
  parent_id: string | null
  description?: string
}

// Kiểu dữ liệu cho Breadcrumb (Đường dẫn)
type Crumb = { id: string | null, name: string }

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  
  // Quản lý thư mục hiện tại
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([{ id: null, name: 'Trang chủ' }])

  const [items, setItems] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch dữ liệu dựa trên thư mục hiện tại (parent_id)
  const fetchDecks = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('decks')
        .select('*')
        .order('created_at', { ascending: false })

      if (currentFolder) {
        query = query.eq('parent_id', currentFolder)
      } else {
        query = query.is('parent_id', null)
      }
      
      const { data, error } = await query
      if (error) throw error
      if (data) setItems(data as Deck[])
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error)
      toast.error("Không thể tải danh sách")
    } finally {
      setLoading(false)
    }
  }, [supabase, currentFolder])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/login')
      } else {
        setUser(user)
        fetchDecks()
      }
    }
    checkUser()
  }, [router, supabase, fetchDecks])

  // Xử lý khi click vào thư mục
  const handleEnterFolder = (folder: Deck) => {
    setCurrentFolder(folder.id)
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }])
  }

  // Xử lý khi click vào breadcrumb để quay lại
  const handleBreadcrumbClick = (index: number) => {
    const target = breadcrumbs[index]
    setCurrentFolder(target.id)
    setBreadcrumbs(prev => prev.slice(0, index + 1))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Phân loại: Cái nào là Folder, cái nào là Bài học
  const folders = items.filter(i => i.type === 'folder')
  const decks = items.filter(i => i.type !== 'folder')
  
  const getDecksByStatus = (status: string) => decks.filter(d => d.status === status)

  if (!user) return null
  const userInitials = user.email ? user.email.substring(0, 2).toUpperCase() : "U"

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white">
      
      {/* --- CLASSIC HEADER --- */}
      <header className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => handleBreadcrumbClick(0)}>
          <div className="w-8 h-8 bg-zinc-900 text-white flex items-center justify-center font-bold text-sm rounded-sm">N1</div>
          <span className="font-bold text-xl tracking-tight">Synapse</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Truyền parentId vào Dialog để tạo đúng chỗ */}
          <CreateDeckDialog 
            onCreated={fetchDecks} 
            parentId={currentFolder} 
            parentName={breadcrumbs[breadcrumbs.length - 1].name}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-1 ring-zinc-200 hover:ring-zinc-900 transition-all">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-zinc-100 text-zinc-900 font-bold border border-zinc-200">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 border-zinc-200 shadow-lg" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Tài khoản</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer focus:bg-zinc-100">
                <User className="mr-2 h-4 w-4" /> Hồ sơ
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-zinc-100">
                <Settings className="mr-2 h-4 w-4" /> Cài đặt
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* --- BREADCRUMB NAV --- */}
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2 text-sm text-zinc-500 overflow-x-auto whitespace-nowrap">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.id || 'root'} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 mx-2 text-zinc-300" />}
            <button 
              onClick={() => handleBreadcrumbClick(index)}
              className={cn(
                "hover:text-zinc-900 transition-colors flex items-center gap-1",
                index === breadcrumbs.length - 1 ? "font-bold text-zinc-900" : ""
              )}
            >
              {index === 0 && <HomeIcon className="h-4 w-4 mb-0.5" />}
              {crumb.name}
            </button>
          </div>
        ))}
      </div>

      <main className="flex-1 p-6 overflow-x-hidden flex flex-col gap-8">
        
        {/* --- SECTION 1: FOLDERS (Thư mục con) --- */}
        {folders.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Thư mục</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {folders.map(folder => (
                <div 
                  key={folder.id}
                  onClick={() => handleEnterFolder(folder)}
                  className="group p-4 border border-zinc-200 rounded-lg cursor-pointer hover:border-zinc-900 hover:shadow-sm transition-all bg-white"
                >
                  <div className="flex justify-between items-start">
                    <Folder className="h-8 w-8 text-zinc-300 group-hover:text-zinc-900 transition-colors fill-zinc-50" />
                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 opacity-0 group-hover:opacity-100">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </div>
                  <h4 className="mt-3 font-semibold text-sm truncate">{folder.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1 truncate">{folder.description || "Không có mô tả"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SECTION 2: KANBAN BOARD (Bài học) --- */}
        <div className="flex-1 flex flex-col min-h-[500px]">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
            Bảng tiến độ - {breadcrumbs[breadcrumbs.length - 1].name}
          </h3>
          
          <div className="flex flex-col md:flex-row gap-6 flex-1 h-full">
            {/* Cột 1: TODO */}
            <div className="flex-1 bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-zinc-700 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-400"></span> Hàng chờ
                  <span className="text-xs bg-white border border-zinc-200 px-2 py-0.5 rounded-full text-zinc-500">{getDecksByStatus('TODO').length}</span>
                </h2>
              </div>
              <div className="space-y-3">
                {getDecksByStatus('TODO').map(deck => <DeckCard key={deck.id} deck={deck} />)}
                {getDecksByStatus('TODO').length === 0 && <EmptyState />}
              </div>
            </div>

            {/* Cột 2: IN_PROGRESS */}
            <div className="flex-1 bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-900"></span> Đang học
                  <span className="text-xs bg-white border border-zinc-200 px-2 py-0.5 rounded-full text-zinc-500">{getDecksByStatus('IN_PROGRESS').length}</span>
                </h2>
              </div>
              <div className="space-y-3">
                {getDecksByStatus('IN_PROGRESS').map(deck => <DeckCard key={deck.id} deck={deck} active />)}
                {getDecksByStatus('IN_PROGRESS').length === 0 && <EmptyState text="Kéo bài học vào đây" />}
              </div>
            </div>

            {/* Cột 3: DONE */}
            <div className="flex-1 bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-zinc-500 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full border border-zinc-400"></span> Hoàn thành
                  <span className="text-xs bg-white border border-zinc-200 px-2 py-0.5 rounded-full text-zinc-500">{getDecksByStatus('DONE').length}</span>
                </h2>
              </div>
              <div className="space-y-3">
                {getDecksByStatus('DONE').map(deck => <DeckCard key={deck.id} deck={deck} done />)}
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}

// Component nhỏ hiển thị thẻ bài học (Card)
function DeckCard({ deck, active = false, done = false }: { deck: Deck, active?: boolean, done?: boolean }) {
  return (
    <div className={cn(
      "bg-white p-4 rounded-lg border cursor-pointer transition-all group",
      active ? "border-zinc-900 shadow-sm ring-1 ring-zinc-100" : "border-zinc-200 hover:border-zinc-400 hover:shadow-sm",
      done ? "opacity-60 grayscale" : ""
    )}>
      <div className="flex justify-between items-start mb-2">
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border",
          deck.type === 'vocab' ? "bg-white border-zinc-900 text-zinc-900" : "bg-zinc-100 border-zinc-200 text-zinc-500"
        )}>
          {deck.type}
        </span>
      </div>
      <h3 className={cn("font-semibold text-sm", done && "line-through text-zinc-400")}>{deck.name}</h3>
      <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{deck.description}</p>
    </div>
  )
}

function EmptyState({ text = "Trống" }: { text?: string }) {
  return (
    <div className="text-center text-zinc-400 text-xs py-8 border-2 border-dashed border-zinc-200 rounded-lg select-none">
      {text}
    </div>
  )
}