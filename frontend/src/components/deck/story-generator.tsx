'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2, Sparkles, Eye, EyeOff, BookOpen as BookOpenIcon } from 'lucide-react'
import { toast } from 'sonner'
import { VocabPopover } from './vocab-popover'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

interface StoryGeneratorProps {
  vocabList: string[]
}

type StoryLine = {
  jp: string
  vi: string
}

export function StoryGenerator({ vocabList }: StoryGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [topic, setTopic] = useState('đời thường')
  const [story, setStory] = useState<StoryLine[]>([])
  const [showAllVi, setShowAllVi] = useState(false)

  const handleGenerate = async () => {
    if (vocabList.length === 0) return toast.error("Cần ít nhất 1 từ vựng")
    
    setLoading(true)
    setStory([]) 
    try {
      const res = await fetch(`${API_URL}/api/ai/generate_story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          vocab_list: vocabList,
          topic: topic
        })
      })

      if (!res.ok) throw new Error("Lỗi kết nối AI Backend")
      
      const data = await res.json()
      if (data.story) {
        setStory(data.story)
        toast.success("Đã tạo xong câu chuyện!")
      }
    } catch (error) {
      console.error(error)
      toast.error("Lỗi tạo truyện. Kiểm tra lại Backend.")
    } finally {
      setLoading(false)
    }
  }

  // Hàm parse bold markdown **text** thành HTML (Dùng cho phần tiếng Việt)
  const renderVi = (text: string) => {
    const html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    return <span dangerouslySetInnerHTML={{ __html: html }} />
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-5 bg-white border-zinc-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2 w-full">
            <Label className="text-zinc-600 font-semibold">Chủ đề câu chuyện</Label>
            <Input 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)} 
              placeholder="VD: trinh thám, tình yêu, công sở..." 
              className="bg-zinc-50 border-zinc-300 focus-visible:ring-zinc-900"
            />
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={loading || vocabList.length === 0}
            className="bg-zinc-900 text-white hover:bg-zinc-800 w-full md:w-auto min-w-[160px]"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-yellow-400" />}
            {story.length > 0 ? 'Viết truyện khác' : 'Tạo câu chuyện AI'}
          </Button>
        </div>
      </Card>

      {/* Story Content */}
      {story.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold text-lg text-zinc-800 flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5 text-zinc-500" />
              Cốt truyện ({topic})
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowAllVi(!showAllVi)} className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100">
              {showAllVi ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showAllVi ? 'Ẩn tất cả dịch' : 'Hiện tất cả dịch'}
            </Button>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm space-y-8">
            {story.map((line, idx) => (
              <InteractiveStoryLine 
                key={idx} 
                line={line} 
                renderVi={renderVi} // Truyền hàm render tiếng Việt xuống
                forceShow={showAllVi} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Component con xử lý từng dòng (Tách từ & Render Popover)
function InteractiveStoryLine({ line, renderVi, forceShow }: { line: StoryLine, renderVi: (t: string) => any, forceShow: boolean }) {
  const [revealed, setRevealed] = useState(false)
  const isVisible = revealed || forceShow
  const [processedNodes, setProcessedNodes] = useState<React.ReactNode[] | null>(null)

  useEffect(() => {
    let isMounted = true;
    const processLine = async () => {
        // Regex để tìm các từ in đậm **word**
        const regex = /(\*\*.*?\*\*)/g;
        const parts = line.jp.split(regex);
        const nodes: React.ReactNode[] = [];

        for (const part of parts) {
            if (part.startsWith('**') && part.endsWith('**')) {
                // Đây là từ vựng mục tiêu (Target Word)
                const word = part.slice(2, -2); // Bỏ dấu **
                nodes.push(
                    <VocabPopover key={Math.random()} word={word} isTarget={true}>
                        <strong className="text-purple-700 font-bold border-b-2 border-purple-200 cursor-pointer hover:bg-purple-50 mx-0.5">{word}</strong>
                    </VocabPopover>
                );
            } else if (part.trim() !== '') {
                // Đây là văn bản thường -> Cần tách từ (Tokenize)
                try {
                    const res = await fetch(`${API_URL}/api/nlp/tokenize`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ text: part })
                    });
                    const data = await res.json();
                    
                    // Render từng từ thường thành Popover
                    data.tokens.forEach((t: string) => {
                        nodes.push(
                            <VocabPopover key={Math.random()} word={t}>
                                {/* SỬA: Hover style nhẹ nhàng, không margin để chữ liền mạch, display inline */}
                                <span className="cursor-pointer hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-sm inline-block select-text">
                                  {t}
                                </span>
                            </VocabPopover>
                        );
                    });
                } catch (e) {
                    // Fallback nếu lỗi: hiện text thường
                    nodes.push(<span key={Math.random()}>{part}</span>);
                }
            }
        }
        if (isMounted) setProcessedNodes(nodes);
    };

    processLine();
    return () => { isMounted = false };
  }, [line.jp]);

  return (
    <div className="group transition-all mb-6">
      {/* Câu tiếng Nhật (Interactive) */}
      <div 
        onClick={() => setRevealed(!revealed)} // Click vào khoảng trắng vẫn toggle dịch
        // SỬA: text-justify để dàn trang đẹp hơn, leading-loose để dễ click
        className="text-xl md:text-2xl leading-loose text-zinc-800 font-medium mb-3 cursor-text text-justify"
      >
        {processedNodes ? (
          // SỬA: Bỏ flex gap, để nó flow tự nhiên như văn bản
          <span>
            {processedNodes}
          </span>
        ) : (
          // Skeleton loader khi đang tách từ
          <div className="animate-pulse bg-zinc-100 h-8 w-3/4 rounded"></div>
        )}
      </div>
      
      {/* Câu tiếng Việt (Ẩn/Hiện) */}
      {isVisible && (
        <div className="text-base md:text-lg text-zinc-500 ml-4 pl-3 border-l-2 border-zinc-300 italic animate-in slide-in-from-top-1 fade-in duration-200">
          {renderVi(line.vi)}
        </div>
      )}
    </div>
  )
}