'use client'

import { useState, FormEvent } from 'react' // <--- Thêm FormEvent vào đây
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  // Sửa lỗi 'e: any' bằng cách thêm kiểu FormEvent
  const handleAuth = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        // Đăng ký
        const { error } = await supabase.auth.signUp({
          email: email.trim(),     // <--- Thêm .trim() vào đây
          password: password.trim(),
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
            data: {
              full_name: email.split('@')[0], 
              avatar_url: '',
            }
          },
        })
        if (error) throw error
        alert('Đăng ký thành công! Hãy kiểm tra email để xác nhận.')
      } else {
        // Đăng nhập
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        
        router.push('/') 
        router.refresh()
      }
    } catch (error: any) {
      alert(error.message || 'Đã có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-primary">
            N1 Synapse
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp ? 'Tạo tài khoản mới' : 'Đăng nhập để tiếp tục học'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Đăng ký' : 'Đăng nhập'}
            </Button>
            
            <div className="text-sm text-center text-slate-500">
              {isSignUp ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}