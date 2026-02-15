'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FileText, FolderPlus, FilePlus, Trash2, PlayCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TreeNode = {
  id: string
  name: string
  type: string
  children?: TreeNode[]
  status?: string // 'TODO' | 'IN_PROGRESS' | 'DONE'
}

interface FolderTreeProps {
  data: TreeNode[]
  onDragStart: (e: React.DragEvent, node: TreeNode) => void
  onCreateFolder: (parentId: string) => void
  onCreateFile: (parentId: string) => void
  onDelete: (id: string, type: string) => void
  onNavigate: (id: string) => void // <--- Thêm prop này
}

function TreeItem({ node, onDragStart, onCreateFolder, onCreateFile, onDelete, onNavigate }: { 
  node: TreeNode, 
  onDragStart: any,
  onCreateFolder: (id: string) => void,
  onCreateFile: (id: string) => void,
  onDelete: (id: string, type: string) => void,
  onNavigate: (id: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  
  const isFolder = node.type === 'folder'
  const hasChildren = node.children && node.children.length > 0

  const handleDragStart = (e: React.DragEvent) => {
    if (!isFolder) {
      onDragStart(e, node)
    } else {
      e.preventDefault()
    }
  }

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

  // Xử lý Click chính
  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen) // Nếu là folder -> Mở/Đóng
    } else {
      onNavigate(node.id) // Nếu là file -> Chuyển trang
    }
  }

  return (
    <div className="pl-4 select-none">
      <div 
        className={cn(
          "flex items-center gap-1.5 py-1 px-2 rounded-md transition-colors cursor-pointer group pr-2",
          isFolder ? "hover:bg-zinc-100 text-zinc-700" : "hover:bg-blue-50 text-zinc-600 hover:text-blue-700"
        )}
        onClick={handleClick} // <--- Gắn sự kiện vào đây
        draggable={!isFolder}
        onDragStart={handleDragStart}
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
        
        <div className="flex items-center gap-0.5">
          {isFolder && (
            <>
              <ActionButton icon={FilePlus} onClick={() => onCreateFile(node.id)} title="Tạo bài học" />
              <ActionButton icon={FolderPlus} onClick={() => onCreateFolder(node.id)} title="Tạo thư mục con" />
            </>
          )}
          
          <ActionButton 
            icon={Trash2} 
            onClick={() => onDelete(node.id, node.type)} 
            title="Xóa" 
            className="hover:text-red-600 hover:bg-red-50"
          />
        </div>
      </div>

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
              onNavigate={onNavigate} // Truyền tiếp xuống con
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderTree({ data, onDragStart, onCreateFolder, onCreateFile, onDelete, onNavigate }: FolderTreeProps) {
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
        />
      ))}
    </div>
  )
}