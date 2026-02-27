import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: 認証処理
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      {/* ロゴ・タイトル */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-primary tracking-widest">Melty</h1>
        <p className="text-sm text-muted-foreground mt-2">顧客管理をもっとスマートに</p>
      </div>

      {/* フォーム */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">パスワード</Label>
          <Input
            id="password"
            type="password"
            placeholder="パスワードを入力"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full">
          ログイン
        </Button>
      </form>

      {/* 区切り線 */}
      <div className="w-full max-w-sm flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">または</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* ソーシャルログイン（将来対応） */}
      <div className="w-full max-w-sm space-y-3">
        <Button variant="outline" className="w-full" disabled>
          Googleでログイン（準備中）
        </Button>
        <Button variant="outline" className="w-full" disabled>
          LINEでログイン（準備中）
        </Button>
      </div>

      {/* 新規登録リンク */}
      <p className="mt-8 text-sm text-muted-foreground">
        アカウントをお持ちでない方は{' '}
        <Link to="/register" className="text-primary font-medium underline underline-offset-4">
          新規登録
        </Link>
      </p>
    </div>
  )
}
