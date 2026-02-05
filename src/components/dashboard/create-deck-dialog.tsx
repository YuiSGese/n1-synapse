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
  DialogTrigger,
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
import { Loader2, Plus, FolderPlus, FilePlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// Nhận thêm prop parentId để biết đang tạo trong thư mục nào
export function CreateDeckDialog({ 
  onCreated, 
  parentId = null,
  parentName = "Trang chủ"
}: { 
  onCreated?: () => void,
  parentId?: string | null,
  parentName?: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  
  // Mặc định nếu ở root thì tạo folder, nếu ở trong folder thì tạo bài học (có thể đổi)
  const [createType, setCreateType] = useState<'folder' | 'deck'>('deck')
  const [contentType, setContentType] = useState('mixed')

  const supabase = createClient()
  const router = useRouter()

  // Reset form khi mở dialog
  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      // Logic thông minh: Nếu đang ở root, ưu tiên tạo Folder. Nếu đang ở trong Folder, ưu tiên tạo Bài học.
      setCreateType(parentId ? 'deck' : 'folder')
    }
  }, [open, parentId])

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Vui lòng nhập tên")

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Chưa đăng nhập")

      // Logic quan trọng:
      // Nếu là 'folder' -> type = 'folder'
      // Nếu là 'deck' -> type = 'mixed' / 'vocab' / ...
      const finalType = createType === 'folder' ? 'folder' : contentType

      const { error } = await supabase.from('decks').insert({
        user_id: user.id,
        name: name,
        description: description,
        type: finalType,
        status: 'TODO', 
        parent_id: parentId // Liên kết với thư mục cha hiện tại
      })

      if (error) throw error

      toast.success(`Đã tạo ${createType === 'folder' ? 'thư mục' : 'bài học'} thành công!`)
      setOpen(false)
      
      if (onCreated) onCreated()
      router.refresh()

    } catch (error: any) {
      toast.error(error.message || "Lỗi khi tạo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-zinc-900 text-white hover:bg-zinc-800 border-zinc-900 shadow-none gap-2">
          <Plus className="h-4 w-4" />
          <span>Tạo mới</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-zinc-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">Tạo nội dung mới</DialogTitle>
          <DialogDescription>
            Thêm vào: <span className="font-semibold text-zinc-900">{parentName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* 1. Chọn loại: Thư mục hay Bài học */}
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Bạn muốn tạo gì?</Label>
            <RadioGroup 
              defaultValue={createType} 
              onValueChange={(v) => setCreateType(v as 'folder' | 'deck')}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="folder" id="type-folder" className="peer sr-only" />
                <Label
                  htmlFor="type-folder"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-zinc-50 peer-data-[state=checked]:border-zinc-900 peer-data-[state=checked]:text-zinc-900 cursor-pointer transition-all"
                >
                  <FolderPlus className="mb-3 h-6 w-6" />
                  Thư mục
                </Label>
              </div>
              <div>
                <RadioGroupItem value="deck" id="type-deck" className="peer sr-only" />
                <Label
                  htmlFor="type-deck"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-zinc-50 peer-data-[state=checked]:border-zinc-900 peer-data-[state=checked]:text-zinc-900 cursor-pointer transition-all"
                >
                  <FilePlus className="mb-3 h-6 w-6" />
                  Bài học
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* 2. Nhập tên */}
          <div className="grid gap-2">
            <Label htmlFor="name">Tên {createType === 'folder' ? 'Thư mục' : 'Bài học'}</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder={createType === 'folder' ? "Ví dụ: Luyện thi N1, Ngữ pháp..." : "Ví dụ: Unit 1, Bài báo NHK..."} 
              className="border-zinc-300 focus-visible:ring-zinc-900"
            />
          </div>

          {/* 3. Chọn loại nội dung (Chỉ hiện khi tạo Bài học) */}
          {createType === 'deck' && (
            <div className="grid gap-2">
              <Label htmlFor="contentType">Nội dung bài học</Label>
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
          )}

          <div className="grid gap-2">
            <Label htmlFor="desc">Mô tả (Tùy chọn)</Label>
            <Textarea 
              id="desc" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú thêm..." 
              className="border-zinc-300 focus-visible:ring-zinc-900 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-zinc-200">Hủy</Button>
          <Button onClick={handleCreate} disabled={loading} className="bg-zinc-900 text-white hover:bg-zinc-800">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tạo ngay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}