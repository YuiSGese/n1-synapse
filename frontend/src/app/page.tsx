'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Settings, LogOut, User, FolderOpen, RefreshCcw, FilePlus, FolderPlus } from 'lucide-react'
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
import { FolderTree, TreeNode } from '@/components/dashboard/folder-tree'

type Deck = {
  id: string
  name: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  type: string
  parent_id: string | null
  description?: string
}

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [allItems, setAllItems] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)

  const [createDialog, setCreateDialog] = useState<{
    open: boolean;
    parentId: string | null;
    type: 'folder' | 'deck';
  }>({
    open: false,
    parentId: null,
    type: 'folder'
  })

  // Hàm điều hướng sang trang chi tiết
  const handleNavigate = (id: string) => {
    router.push(`/decks/${id}`)
  }

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .order('name', { ascending: true })
      
      if (error) throw error
      if (data) setAllItems(data as Deck[])
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error)
      toast.error("Không thể tải dữ liệu")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/login')
      } else {
        setUser(user)
        fetchAllData()
      }
    }
    checkUser()
  }, [router, supabase, fetchAllData])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const openCreateFolder = (parentId: string | null) => {
    setCreateDialog({ open: true, parentId, type: 'folder' })
  }
  const openCreateFile = (parentId: string | null) => {
    setCreateDialog({ open: true, parentId, type: 'deck' })
  }

  const handleDelete = async (id: string, type: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${type === 'folder' ? 'thư mục' : 'bài học'} này không?`)) return
    setAllItems(prev => prev.filter(item => item.id !== id))
    const { error } = await supabase.from('decks').delete().eq('id', id)
    if (error) { toast.error("Lỗi khi xóa"); fetchAllData() }
    else { toast.success("Đã xóa thành công") }
  }

  const treeData = useMemo(() => {
    const nodes = allItems
    const buildTree = (parentId: string | null): TreeNode[] => {
      return nodes
        .filter(node => node.parent_id === parentId)
        .map(node => ({
          id: node.id,
          name: node.name,
          type: node.type,
          status: node.status,
          children: buildTree(node.id)
        }))
    }
    return buildTree(null)
  }, [allItems])

  const handleDragStart = (e: React.DragEvent, node: TreeNode) => {
    e.dataTransfer.setData("deckId", node.id)
  }
  
  const handleDrop = async (e: React.DragEvent, newStatus: 'IN_PROGRESS' | 'DONE') => {
    e.preventDefault()
    const deckId = e.dataTransfer.getData("deckId")
    if (!deckId) return
    const updatedItems = allItems.map(item => item.id === deckId ? { ...item, status: newStatus } : item)
    setAllItems(updatedItems)
    const { error } = await supabase.from('decks').update({ status: newStatus }).eq('id', deckId)
    if (error) { toast.error("Lỗi cập nhật"); fetchAllData() }
    else { toast.success(newStatus === 'IN_PROGRESS' ? "Bắt đầu học bài này!" : "Đã hoàn thành!") }
  }
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const inProgressDecks = allItems.filter(i => i.status === 'IN_PROGRESS' && i.type !== 'folder')
  const doneDecks = allItems.filter(i => i.status === 'DONE' && i.type !== 'folder')

  if (!user) return null
  const userInitials = user.email ? user.email.substring(0, 2).toUpperCase() : "U"

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-zinc-900">
      
      <CreateDeckDialog 
        open={createDialog.open}
        onOpenChange={(val) => setCreateDialog(prev => ({ ...prev, open: val }))}
        parentId={createDialog.parentId}
        type={createDialog.type}
        onCreated={fetchAllData}
      />

      {/* HEADER */}
      <header className="h-14 border-b border-zinc-200 bg-white flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer select-none">
          <div className="w-6 h-6 bg-zinc-900 text-white flex items-center justify-center font-bold text-xs rounded-sm">N1</div>
          <span className="font-bold text-lg tracking-tight">Synapse</span>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full ring-1 ring-zinc-200 hover:ring-zinc-900 transition-all">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-zinc-100 text-zinc-900 font-bold text-xs">{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><User className="mr-2 h-4 w-4" /> Hồ sơ</DropdownMenuItem>
              <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Cài đặt</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600"><LogOut className="mr-2 h-4 w-4" /> Đăng xuất</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden h-[calc(100vh-56px)]">
        
        {/* SIDEBAR */}
        <aside className="w-72 border-r border-zinc-200 bg-zinc-50 flex flex-col">
          <div className="p-3 border-b border-zinc-200 flex justify-between items-center bg-white sticky top-0 z-10 group">
            <h2 className="font-bold text-xs text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <FolderOpen className="h-3.5 w-3.5" /> Explorer
            </h2>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => openCreateFile(null)} className="p-1 hover:bg-zinc-100 rounded" title="Tạo bài học gốc"><FilePlus className="h-4 w-4 text-zinc-600" /></button>
               <button onClick={() => openCreateFolder(null)} className="p-1 hover:bg-zinc-100 rounded" title="Tạo thư mục gốc"><FolderPlus className="h-4 w-4 text-zinc-600" /></button>
               <button onClick={fetchAllData} className="p-1 hover:bg-zinc-100 rounded" title="Tải lại"><RefreshCcw className="h-3.5 w-3.5 text-zinc-600" /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <FolderTree 
              data={treeData} 
              onDragStart={handleDragStart} 
              onCreateFolder={openCreateFolder}
              onCreateFile={openCreateFile}
              onDelete={handleDelete}
              onNavigate={handleNavigate} // <--- Truyền hàm điều hướng vào đây
            />
          </div>
        </aside>

        {/* MAIN KANBAN */}
        <main className="flex-1 bg-white p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto h-full flex flex-col md:flex-row gap-6">
            
            {/* IN PROGRESS */}
            <div className="flex-1 flex flex-col rounded-xl bg-blue-50/30 border-2 border-dashed border-blue-100"
              onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'IN_PROGRESS')}>
              <div className="p-4 border-b border-blue-100 bg-blue-50/50 rounded-t-xl flex justify-between">
                <h2 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Đang học
                  <span className="text-xs bg-white px-2 py-0.5 rounded-full text-blue-500">{inProgressDecks.length}</span>
                </h2>
              </div>
              <div className="flex-1 p-3 space-y-3 min-h-[200px]">
                {inProgressDecks.map(deck => (
                   <div 
                    key={deck.id} 
                    className="bg-white p-3 rounded border border-blue-200 shadow-sm relative group cursor-pointer hover:shadow-md transition-all"
                    onClick={() => handleNavigate(deck.id)} // <--- Click vào Kanban cũng chuyển trang
                   >
                      <h3 className="font-medium text-sm text-zinc-800">{deck.name}</h3>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation() // Chặn click lan ra ngoài
                          handleDelete(deck.id, deck.type)
                        }}
                        className="absolute top-2 right-2 p-1 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Settings className="h-3 w-3" />
                      </button>
                   </div>
                ))}
              </div>
            </div>

            {/* DONE */}
            <div className="flex-1 flex flex-col rounded-xl bg-zinc-50 border border-zinc-200"
              onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'DONE')}>
              <div className="p-4 border-b border-zinc-200 bg-zinc-100 rounded-t-xl flex justify-between">
                <h2 className="font-bold text-zinc-500 text-sm flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-green-500"></span> Hoàn thành
                   <span className="text-xs bg-white px-2 py-0.5 rounded-full text-zinc-500">{doneDecks.length}</span>
                </h2>
              </div>
               <div className="flex-1 p-3 space-y-3 min-h-[200px]">
                 {doneDecks.map(deck => (
                    <div 
                      key={deck.id} 
                      className="bg-white p-3 rounded border border-zinc-200 opacity-60 hover:opacity-100 transition-all cursor-pointer"
                      onClick={() => handleNavigate(deck.id)} // <--- Click vào Kanban cũng chuyển trang
                    >
                      <h3 className="font-medium text-sm text-zinc-800 line-through">{deck.name}</h3>
                    </div>
                  ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}