'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Settings, LogOut, User, FolderOpen, RefreshCcw, FilePlus, FolderPlus, Menu, Plus, LayoutPanelLeft } from 'lucide-react'
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
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

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
  
  // State quản lý tab trên mobile
  const [mobileTab, setMobileTab] = useState("in_progress")

  const [createDialog, setCreateDialog] = useState<{
    open: boolean;
    parentId: string | null;
    type: 'folder' | 'deck';
  }>({
    open: false,
    parentId: null,
    type: 'folder'
  })

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
  const todoDecks = allItems.filter(i => i.status === 'TODO' && i.type !== 'folder') 

  if (!user) return null
  const userInitials = user.email ? user.email.substring(0, 2).toUpperCase() : "U"

  // Component Nội dung Sidebar
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-zinc-50">
        <div className="p-3 border-b border-zinc-200 flex justify-between items-center bg-white sticky top-0 z-10 group">
            <h2 className="font-bold text-xs text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <FolderOpen className="h-3.5 w-3.5" /> Kho dữ liệu
            </h2>
            <div className="flex items-center gap-1">
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
              onNavigate={handleNavigate}
            />
        </div>
        <div className="p-3 bg-zinc-100 text-[10px] text-zinc-400 text-center border-t border-zinc-200 hidden md:block">
            Kéo bài học sang bên phải để bắt đầu học
        </div>
    </div>
  )

  // Component render một cột Kanban
  const KanbanColumn = ({ title, items, color, bgClass, status }: any) => (
    <div 
        className={cn("flex-1 flex flex-col rounded-xl border-2 transition-colors h-full", bgClass)}
        onDragOver={handleDragOver} 
        onDrop={(e) => handleDrop(e, status)}
    >
        <div className={cn("p-4 border-b rounded-t-xl flex justify-between", color)}>
            <h2 className="font-bold text-sm flex items-center gap-2">
                {title}
                <span className="text-xs bg-white px-2 py-0.5 rounded-full opacity-80">{items.length}</span>
            </h2>
        </div>
        <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[200px]">
            {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-sm opacity-60">
                    <p>Trống</p>
                </div>
            ) : (
                items.map((deck: Deck) => (
                    <div 
                    key={deck.id} 
                    className={cn(
                        "bg-white p-4 rounded-xl border shadow-sm relative group cursor-pointer transition-all active:scale-95",
                        status === 'DONE' ? "border-zinc-200 opacity-60" : "border-blue-200 hover:shadow-md hover:border-blue-300"
                    )}
                    onClick={() => handleNavigate(deck.id)}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold uppercase text-zinc-400 border px-1 rounded">{deck.type}</span>
                        </div>
                        <h3 className={cn("font-semibold text-sm text-zinc-800", status === 'DONE' && "line-through")}>{deck.name}</h3>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(deck.id, deck.type)
                            }}
                            className="absolute top-3 right-3 p-1 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Settings className="h-3 w-3" />
                        </button>
                    </div>
                ))
            )}
        </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-zinc-900 overflow-hidden fixed inset-0">
      
      {/* Dialog Tạo Mới (Dùng chung) - Ẩn trigger mặc định bằng span hidden */}
      <CreateDeckDialog 
        open={createDialog.open}
        onOpenChange={(val) => setCreateDialog(prev => ({ ...prev, open: val }))}
        parentId={createDialog.parentId}
        type={createDialog.type}
        onCreated={fetchAllData}
        trigger={<span className="hidden"></span>}
      />

      {/* HEADER */}
      <header className="h-14 border-b border-zinc-200 bg-white flex items-center justify-between px-4 sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-3">
            {/* MOBILE MENU TRIGGER */}
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="-ml-2">
                            <Menu className="h-5 w-5 text-zinc-600" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-80">
                        <SheetHeader className="p-4 border-b border-zinc-100">
                            <SheetTitle className="text-left flex items-center gap-2">
                                <div className="w-6 h-6 bg-zinc-900 text-white flex items-center justify-center font-bold text-xs rounded-sm">N1</div>
                                Synapse
                            </SheetTitle>
                        </SheetHeader>
                        <div className="h-full pb-20">
                            <SidebarContent />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* LOGO */}
            <div className="flex items-center gap-2 cursor-pointer select-none">
                <div className="w-6 h-6 bg-zinc-900 text-white flex items-center justify-center font-bold text-xs rounded-sm hidden md:flex">N1</div>
                <span className="font-bold text-lg tracking-tight">Synapse</span>
            </div>
        </div>

        {/* USER MENU */}
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
              <DropdownMenuItem onClick={handleLogout} className="text-red-600"><LogOut className="mr-2 h-4 w-4" /> Đăng xuất</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="w-72 border-r border-zinc-200 bg-zinc-50 hidden md:flex flex-col">
          <SidebarContent />
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 bg-white flex flex-col overflow-hidden relative">
            
            {/* DESKTOP VIEW (3 Cột) */}
            <div className="hidden md:flex flex-row gap-6 p-6 h-full max-w-6xl mx-auto w-full">
                <KanbanColumn 
                    title="Đang học" 
                    items={inProgressDecks} 
                    status="IN_PROGRESS" 
                    bgClass="bg-blue-50/30 border-dashed border-blue-100" 
                    color="text-blue-900 bg-blue-50/50 border-blue-100"
                />
                <KanbanColumn 
                    title="Hoàn thành" 
                    items={doneDecks} 
                    status="DONE" 
                    bgClass="bg-zinc-50 border-zinc-200" 
                    color="text-zinc-500 bg-zinc-100 border-zinc-200"
                />
            </div>

            {/* MOBILE VIEW (Tabs + FAB) */}
            <div className="md:hidden flex-1 flex flex-col h-full">
                <Tabs value={mobileTab} onValueChange={setMobileTab} className="flex-1 flex flex-col">
                    <div className="px-4 pt-2 pb-2 bg-white border-b border-zinc-100 shrink-0">
                        <TabsList className="grid w-full grid-cols-3 bg-zinc-100/50">
                            <TabsTrigger value="todo" className="text-xs">Hàng chờ</TabsTrigger>
                            <TabsTrigger value="in_progress" className="text-xs font-bold text-blue-700 data-[state=active]:bg-white data-[state=active]:shadow-sm">Đang học</TabsTrigger>
                            <TabsTrigger value="done" className="text-xs text-zinc-500">Xong</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-hidden p-4 bg-zinc-50/30">
                        <TabsContent value="todo" className="h-full mt-0">
                            <KanbanColumn 
                                title="Hàng chờ (Mới tạo)" 
                                items={todoDecks} 
                                status="TODO" 
                                bgClass="bg-white border-zinc-100 shadow-sm" 
                                color="text-zinc-700 border-zinc-100 bg-white"
                            />
                        </TabsContent>
                        <TabsContent value="in_progress" className="h-full mt-0">
                            <KanbanColumn 
                                title="Đang học" 
                                items={inProgressDecks} 
                                status="IN_PROGRESS" 
                                bgClass="bg-blue-50/20 border-blue-100" 
                                color="text-blue-800 border-blue-100 bg-blue-50"
                            />
                        </TabsContent>
                        <TabsContent value="done" className="h-full mt-0">
                            <KanbanColumn 
                                title="Đã hoàn thành" 
                                items={doneDecks} 
                                status="DONE" 
                                bgClass="bg-zinc-50 border-zinc-200" 
                                color="text-zinc-500 border-zinc-200 bg-zinc-100"
                            />
                        </TabsContent>
                    </div>
                </Tabs>

                {/* FAB (Floating Action Button) - Chỉ hiện trên Mobile */}
                <div className="absolute bottom-6 right-6 z-50">
                    <CreateDeckDialog 
                        open={createDialog.open}
                        onOpenChange={(val) => setCreateDialog(prev => ({ ...prev, open: val }))}
                        parentId={null} 
                        type={createDialog.type}
                        onCreated={fetchAllData}
                        trigger={
                            <Button 
                                onClick={() => openCreateFile(null)} 
                                className="h-14 w-14 rounded-full shadow-xl bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                            >
                                <Plus className="h-6 w-6" />
                            </Button>
                        }
                    />
                </div>
            </div>

        </main>
      </div>
    </div>
  )
}