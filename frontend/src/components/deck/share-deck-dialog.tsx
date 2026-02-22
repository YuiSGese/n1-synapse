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
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2, Share2, Globe, Lock } from 'lucide-react'

interface ShareDeckDialogProps {
  deck: any
  onUpdated: () => void
  externalOpen?: boolean // Thêm để điều khiển từ xa
  onExternalOpenChange?: (open: boolean) => void
}

export function ShareDeckDialog({ deck, onUpdated, externalOpen, onExternalOpenChange }: ShareDeckDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const [tags, setTags] = useState('')

  // Ưu tiên state từ bên ngoài truyền vào, nếu không có thì dùng state nội bộ
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = onExternalOpenChange !== undefined ? onExternalOpenChange : setInternalOpen

  const supabase = createClient()

  useEffect(() => {
    if (open && deck) {
      setIsPublic(deck.is_public || false)
      setAuthorName(deck.author_name || '')
      setTags(deck.tags ? deck.tags.join(', ') : '')
    }
  }, [open, deck])

  const handleSave = async () => {
    setLoading(true)
    try {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t !== '')
      
      const { error } = await supabase
        .from('decks')
        .update({ 
          is_public: isPublic,
          author_name: authorName,
          tags: tagsArray
        })
        .eq('id', deck.id)

      if (error) throw error

      toast.success(isPublic ? "Đã công khai khóa học!" : "Đã chuyển về riêng tư")
      setOpen(false)
      onUpdated()
    } catch (error: any) {
      toast.error("Lỗi cập nhật: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!deck) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Chỉ hiển thị Trigger mặc định nếu KHÔNG bị điều khiển từ bên ngoài */}
      {externalOpen === undefined && (
        <DialogTrigger asChild>
          <Button 
              variant="outline" 
              size="sm" 
              className={`gap-2 h-8 transition-colors ${deck.is_public ? 'text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            {deck.is_public ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {deck.is_public ? 'Đang Công khai' : 'Riêng tư'}
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-500" />
            Chia sẻ {deck.type === 'folder' ? 'Thư mục' : 'Khóa học'}
          </DialogTitle>
          <DialogDescription>
            Đưa {deck.type === 'folder' ? 'thư mục' : 'khóa học'} này lên Thư viện Cộng đồng để mọi người có thể tìm thấy và tải về.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex items-center justify-between border p-4 rounded-xl bg-zinc-50/50">
            <div className="space-y-0.5 pr-4">
              <Label className="text-base font-semibold text-zinc-900">Công khai dữ liệu</Label>
              <p className="text-xs text-zinc-500 leading-relaxed">Khi bật, mọi người có thể clone toàn bộ từ vựng bên trong về máy của họ.</p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {isPublic && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid gap-2">
                <Label htmlFor="author" className="text-zinc-600">Tên tác giả (Hiển thị công khai)</Label>
                <Input 
                  id="author" 
                  value={authorName} 
                  onChange={(e) => setAuthorName(e.target.value)} 
                  placeholder="VD: sensei123, N1 Master..." 
                  className="focus-visible:ring-blue-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags" className="text-zinc-600">Từ khóa (Tags)</Label>
                <Input 
                  id="tags" 
                  value={tags} 
                  onChange={(e) => setTags(e.target.value)} 
                  placeholder="VD: N1, Từ vựng, Shinkanzen..." 
                  className="focus-visible:ring-blue-500"
                />
                <p className="text-[10px] text-zinc-400 font-medium">Các từ khóa cách nhau bằng dấu phẩy ( , )</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Hủy</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Lưu cài đặt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}