'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, FolderPlus, FilePlus } from 'lucide-react'

// Props mới: Điều khiển từ bên ngoài (Controlled)
interface CreateDeckDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentId: string | null
  type: 'folder' | 'deck' // Chế độ tạo
  onCreated: () => void
}

export function CreateDeckDialog({ 
  open, 
  onOpenChange, 
  parentId, 
  type,
  onCreated 
}: CreateDeckDialogProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [contentType, setContentType] = useState('mixed')

  const supabase = createClient()

  // Reset form mỗi khi mở dialog
  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setContentType('mixed')
    }
  }, [open])

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Vui lòng nhập tên")

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Chưa đăng nhập")

      // Nếu là folder -> type = 'folder'
      // Nếu là bài học -> type = 'vocab' / 'kanji' ... (lấy từ dropdown)
      const finalType = type === 'folder' ? 'folder' : contentType

      const { error } = await supabase.from('decks').insert({
        user_id: user.id,
        name: name,
        description: description,
        type: finalType,
        status: 'TODO', 
        parent_id: parentId // Tạo đúng chỗ user đang chọn
      })

      if (error) throw error

      toast.success(`Đã tạo ${type === 'folder' ? 'thư mục' : 'bài học'} mới!`)
      onOpenChange(false) // Đóng dialog
      onCreated() // Reload data

    } catch (error: any) {
      toast.error(error.message || "Lỗi khi tạo")
    } finally {
      setLoading(false)
    }
  }

  const isFolder = type === 'folder'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-zinc-200 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${isFolder ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
              {isFolder ? <FolderPlus className="h-6 w-6" /> : <FilePlus className="h-6 w-6" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {isFolder ? 'Tạo Thư mục mới' : 'Tạo Bài học mới'}
              </DialogTitle>
              <DialogDescription className="text-xs mt-1">
                {parentId ? 'Sẽ được tạo bên trong thư mục đang chọn' : 'Sẽ được tạo tại Thư mục gốc'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {/* Tên - Luôn hiện */}
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-zinc-500 font-medium">Tên {isFolder ? 'Thư mục' : 'Bài học'}</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder={isFolder ? "VD: N1, Đọc hiểu..." : "VD: Bài 1, Báo NHK..."} 
              className="border-zinc-300 focus-visible:ring-zinc-900"
              autoFocus
            />
          </div>

          {/* Các trường mở rộng - Chỉ hiện khi tạo Bài học (File) */}
          {!isFolder && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="contentType" className="text-zinc-500 font-medium">Loại nội dung</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger className="border-zinc-300 focus:ring-zinc-900">
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">Hỗn hợp (Mixed)</SelectItem>
                    <SelectItem value="vocab">Từ vựng (Vocabulary)</SelectItem>
                    <SelectItem value="kanji">Hán tự (Kanji)</SelectItem>
                    <SelectItem value="grammar">Ngữ pháp (Grammar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="desc" className="text-zinc-500 font-medium">Mô tả (Tùy chọn)</Label>
                <Textarea 
                  id="desc" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ghi chú thêm..." 
                  className="border-zinc-300 focus-visible:ring-zinc-900 resize-none h-20"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleCreate} disabled={loading} className="bg-zinc-900 text-white hover:bg-zinc-800">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isFolder ? 'Tạo Thư mục' : 'Tạo Bài học'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}