'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FileText, FolderPlus, FilePlus, Trash2, PlayCircle, CheckCircle2, Pencil, CloudDownload, Share2, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

export type TreeNode = {
  id: string
  name: string
  type: string
  children?: TreeNode[]
  status?: string
  is_downloaded?: boolean 
}

interface FolderTreeProps {
  data: TreeNode[]
  level?: number
  onDragStart?: (e: React.DragEvent, node: TreeNode) => void
  onCreateFolder?: (parentId: string) => void
  onCreateFile?: (parentId: string) => void
  onDelete?: (id: string, type: string) => void
  onNavigate?: (id: string) => void
  onRename?: (id: string, currentName: string, type: string) => void
  onShare?: (node: TreeNode) => void 
  onMove?: (dragId: string, targetFolderId: string) => void
}

export function FolderTree({ 
  data, 
  level = 0, 
  onDragStart, 
  onCreateFolder, 
  onCreateFile, 
  onDelete, 
  onNavigate,
  onRename,
  onShare,
  onMove
}: FolderTreeProps) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({})
  
  const toggleFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenFolders(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const ActionButton = ({ icon: Icon, onClick, title, className }: any) => (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn("p-1.5 text-zinc-300 hover:text-zinc-900 rounded-md transition-all hover:bg-zinc-100", className)}
      title={title}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const dragId = e.dataTransfer.getData("deckId")
    if (dragId && onMove) {
      onMove(dragId, targetFolderId)
      setOpenFolders(prev => ({ ...prev, [targetFolderId]: true }))
    }
  }

  return (
    <div className="space-y-0.5">
      {data.map((node) => {
        const isFolder = node.type === 'folder'
        const isOpen = openFolders[node.id]

        // ĐÃ FIX: Bọc title vào thẻ span thay vì truyền trực tiếp vào Icon
        const StatusIcon = () => {
          if (isFolder) return null
          if (node.status === 'DONE') return <span title="Hoàn thành"><CheckCircle2 className="h-3 w-3 text-green-500" /></span>
          if (node.status === 'IN_PROGRESS') return <span title="Đang học"><PlayCircle className="h-3 w-3 text-blue-500" /></span>
          return <span className="h-1.5 w-1.5 rounded-full bg-orange-400" title="Hàng chờ" />
        }

        return (
          <div key={node.id}>
            <div 
              className={cn(
                "group flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-zinc-100 border border-transparent",
                !isFolder && "hover:border-zinc-200 bg-white shadow-sm mb-1"
              )}
              style={{ paddingLeft: `${level * 12 + 8}px` }}
              onClick={() => isFolder ? setOpenFolders(prev => ({ ...prev, [node.id]: !prev[node.id] })) : (onNavigate && onNavigate(node.id))}
              draggable={true}
              onDragStart={(e) => {
                if (onDragStart) onDragStart(e, node)
              }}
              onDragOver={isFolder ? handleDragOver : undefined}
              onDrop={isFolder ? (e) => handleDrop(e, node.id) : undefined}
            >
              {isFolder ? (
                <button onClick={(e) => toggleFolder(node.id, e)} className="p-0.5 hover:bg-zinc-200 rounded-sm text-zinc-400">
                  {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              ) : (
                <div className="w-4" /> 
              )}

              {isFolder ? (
                <Folder className={cn("h-4 w-4 fill-zinc-100 text-zinc-400 group-hover:text-zinc-600", isOpen && "fill-zinc-200")} />
              ) : (
                <FileText className="h-4 w-4 text-blue-300 group-hover:text-blue-500" />
              )}

              <span className="text-sm truncate flex-1 flex items-center gap-2">
                {node.name}
                {/* ĐÃ FIX: Bọc title vào thẻ span */}
                {node.is_downloaded && <span title="Tải từ cộng đồng"><CloudDownload className="h-3 w-3 text-blue-500" /></span>}
                <StatusIcon />
              </span>
              
              {/* Desktop Actions */}
              <div className="flex items-center gap-0.5 hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity">
                {isFolder && (
                  <>
                    <ActionButton icon={FolderPlus} onClick={() => onCreateFolder && onCreateFolder(node.id)} title="Thư mục con" />
                    <ActionButton icon={FilePlus} onClick={() => onCreateFile && onCreateFile(node.id)} title="Bài học mới" />
                  </>
                )}
                {!node.is_downloaded && (
                    <>
                      <ActionButton icon={Share2} onClick={() => onShare && onShare(node)} title="Chia sẻ" className="hover:text-blue-600 hover:bg-blue-50" />
                      <ActionButton icon={Pencil} onClick={() => onRename && onRename(node.id, node.name, node.type)} title="Đổi tên" />
                    </>
                )}
                <ActionButton icon={Trash2} onClick={() => onDelete && onDelete(node.id, node.type)} title="Xóa" className="hover:text-red-600 hover:bg-red-50" />
              </div>

              {/* Mobile Actions */}
              <div className="md:hidden">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400"><MoreVertical className="h-4 w-4" /></Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="end">
                    <div className="flex flex-col gap-1">
                      {isFolder && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => onCreateFolder && onCreateFolder(node.id)} className="justify-start"><FolderPlus className="h-4 w-4 mr-2" /> Thư mục con</Button>
                          <Button variant="ghost" size="sm" onClick={() => onCreateFile && onCreateFile(node.id)} className="justify-start"><FilePlus className="h-4 w-4 mr-2" /> Bài học mới</Button>
                        </>
                      )}
                      {!node.is_downloaded && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => onShare && onShare(node)} className="justify-start text-blue-600"><Share2 className="h-4 w-4 mr-2" /> Chia sẻ</Button>
                            <Button variant="ghost" size="sm" onClick={() => onRename && onRename(node.id, node.name, node.type)} className="justify-start"><Pencil className="h-4 w-4 mr-2" /> Đổi tên</Button>
                          </>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => onDelete && onDelete(node.id, node.type)} className="justify-start text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4 mr-2" /> Xóa</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

            </div>

            {isFolder && isOpen && node.children && (
              <div className="mt-0.5">
                <FolderTree 
                  data={node.children} 
                  level={level + 1} 
                  onDragStart={onDragStart}
                  onCreateFolder={onCreateFolder}
                  onCreateFile={onCreateFile}
                  onDelete={onDelete}
                  onNavigate={onNavigate}
                  onRename={onRename}
                  onShare={onShare}
                  onMove={onMove}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}