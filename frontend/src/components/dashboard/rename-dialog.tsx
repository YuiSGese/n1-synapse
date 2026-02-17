'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RenameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deckId: string | null
  currentName: string
  type: string
  onRenamed: () => void
}

export function RenameDialog({ 
  open, 
  onOpenChange, 
  deckId,
  currentName,
  type,
  onRenamed 
}: RenameDialogProps) {
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState(currentName)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (open) setNewName(currentName)
  }, [open, currentName])

  const handleRename = async () => {
    if (!newName.trim() || !deckId) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('decks')
        .update({ name: newName })
        .eq('id', deckId)

      if (error) throw error

      toast.success("Đã đổi tên thành công")
      onOpenChange(false)
      onRenamed()
      router.refresh()
    } catch (error: any) {
      toast.error("Lỗi khi đổi tên")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Đổi tên {type === 'folder' ? 'thư mục' : 'bài học'}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)} 
            placeholder="Nhập tên mới..."
            className="font-medium"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleRename} disabled={loading} className="bg-zinc-900">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}