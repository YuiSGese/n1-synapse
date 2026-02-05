import { createBrowserClient } from '@supabase/ssr'

// Hàm này giúp tạo kết nối đến Supabase từ phía Client (Trình duyệt)
// Chúng ta sẽ dùng nó trong các React Component
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}