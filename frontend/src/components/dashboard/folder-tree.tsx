'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FileText, FolderPlus, FilePlus, Trash2, PlayCircle, CheckCircle2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuLabel,
} from "@/components/ui/context-menu"

export type TreeNode = {
  id: string
  name: string
  type: string
  children?: TreeNode[]
  status?: string
}

interface FolderTreeProps {
  data: TreeNode[]
  onDragStart: (e: React.DragEvent, node: TreeNode) => void
  onCreateFolder: (parentId: string) => void
  onCreateFile: (parentId: string) => void
  onDelete: (id: string, type: string) => void
  onNavigate: (id: string) => void
  onRename: (id: string, name: string, type: string) => void
  onMove: (dragId: string, targetFolderId: string) => void // <--- Callback mới cho hành động di chuyển
}

function TreeItem({ node, onDragStart, onCreateFolder, onCreateFile, onDelete, onNavigate, onRename, onMove }: { 
  node: TreeNode, 
  onDragStart: any,
  onCreateFolder: (id: string) => void,
  onCreateFile: (id: string) => void,
  onDelete: (id: string, type: string) => void,
  onNavigate: (id: string) => void,
  onRename: (id: string, name: string, type: string) => void,
  onMove: (dragId: string, targetId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false) // State để highlight khi kéo vào
  
  const isFolder = node.type === 'folder'
  const hasChildren = node.children && node.children.length > 0

  const handleDragStart = (e: React.DragEvent) => {
    // Cho phép kéo cả Folder và File (để sắp xếp lại)
    onDragStart(e, node)
  }

  // --- LOGIC DROP ZONE (Chỉ cho Folder) ---
  const handleDragOver = (e: React.DragEvent) => {
    if (!isFolder) return
    e.preventDefault() // Bắt buộc để cho phép drop
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isFolder) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    if (!isFolder) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    const dragId = e.dataTransfer.getData("deckId")
    if (dragId && dragId !== node.id) {
      // Gọi hàm di chuyển: dragId chui vào node.id
      onMove(dragId, node.id)
    }
  }

  // Nút hành động nhanh
  const ActionButton = ({ icon: Icon, onClick, title, className }: any) => (
    <button 
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn("p-1 rounded-sm hover:bg-zinc-200 text-zinc-400 hover:text-zinc-800 transition-all opacity-0 group-hover:opacity-100", className)}
      title={title}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )

  const StatusIcon = () => {
    if (isFolder) return null
    if (node.status === 'IN_PROGRESS') return <PlayCircle className="h-3 w-3 text-blue-500 ml-1" />
    if (node.status === 'DONE') return <CheckCircle2 className="h-3 w-3 text-green-500 ml-1" />
    return null
  }

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen)
    } else {
      onNavigate(node.id)
    }
  }

  return (
    <div className="select-none">
      <ContextMenu>
        <ContextMenuTrigger>
          <div 
            className={cn(
              "flex items-center gap-1.5 py-1.5 px-2 rounded-md transition-colors cursor-pointer group pr-2 ml-4 border border-transparent",
              // Style bình thường
              isFolder ? "hover:bg-zinc-100 text-zinc-700" : "hover:bg-blue-50 text-zinc-600 hover:text-blue-700",
              // Style khi có ai đó đang kéo vào (Highlight Droppable)
              isDragOver && "bg-blue-100 border-blue-300 ring-2 ring-blue-200 z-10 relative"
            )}
            onClick={handleClick}
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <span className="w-4 h-4 flex items-center justify-center shrink-0">
              {isFolder && (
                hasChildren ? (
                  isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
                ) : <div className="w-3" />
              )}
            </span>

            {isFolder ? (
              <Folder className={cn("h-4 w-4 fill-zinc-100 text-zinc-400 group-hover:text-zinc-600", isOpen && "fill-zinc-200")} />
            ) : (
              <FileText className="h-4 w-4 text-blue-300 group-hover:text-blue-500" />
            )}

            <span className="text-sm truncate flex-1 flex items-center gap-2">
              {node.name}
              <StatusIcon />
            </span>
            
            {/* Desktop Actions */}
            <div className="flex items-center gap-0.5 hidden md:flex">
              {isFolder && (
                <>
                  <ActionButton icon={FilePlus} onClick={() => onCreateFile(node.id)} title="Tạo bài học" />
                  <ActionButton icon={FolderPlus} onClick={() => onCreateFolder(node.id)} title="Tạo thư mục con" />
                </>
              )}
              <ActionButton icon={Pencil} onClick={() => onRename(node.id, node.name, node.type)} title="Đổi tên" />
              <ActionButton icon={Trash2} onClick={() => onDelete(node.id, node.type)} title="Xóa" className="hover:text-red-600 hover:bg-red-50" />
            </div>
          </div>
        </ContextMenuTrigger>

        {/* MENU NGỮ CẢNH (Mobile Long Press) */}
        <ContextMenuContent className="w-48">
          <ContextMenuLabel>{isFolder ? 'Thư mục' : 'Bài học'}: {node.name}</ContextMenuLabel>
          <ContextMenuSeparator />
          
          {isFolder && (
            <>
              <ContextMenuItem onClick={() => onCreateFile(node.id)}>
                <FilePlus className="mr-2 h-4 w-4" /> Tạo bài học mới
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onCreateFolder(node.id)}>
                <FolderPlus className="mr-2 h-4 w-4" /> Tạo thư mục con
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          
          <ContextMenuItem onClick={() => onRename(node.id, node.name, node.type)}>
            <Pencil className="mr-2 h-4 w-4" /> Đổi tên
          </ContextMenuItem>
          
          <ContextMenuItem onClick={() => onDelete(node.id, node.type)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
            <Trash2 className="mr-2 h-4 w-4" /> Xóa bỏ
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isFolder && isOpen && hasChildren && (
        <div className="border-l border-zinc-200 ml-3">
          {node.children!.map(child => (
            <TreeItem 
              key={child.id} 
              node={child} 
              onDragStart={onDragStart} 
              onCreateFolder={onCreateFolder}
              onCreateFile={onCreateFile}
              onDelete={onDelete}
              onNavigate={onNavigate}
              onRename={onRename}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderTree({ data, onDragStart, onCreateFolder, onCreateFile, onDelete, onNavigate, onRename, onMove }: FolderTreeProps) {
  if (!data || data.length === 0) {
    return <div className="text-zinc-400 text-xs p-4 italic text-center">Chưa có dữ liệu</div>
  }

  return (
    <div className="flex flex-col gap-0.5">
      {data.map(node => (
        <TreeItem 
          key={node.id} 
          node={node} 
          onDragStart={onDragStart} 
          onCreateFolder={onCreateFolder}
          onCreateFile={onCreateFile}
          onDelete={onDelete}
          onNavigate={onNavigate}
          onRename={onRename}
          onMove={onMove}
        />
      ))}
    </div>
  )
}