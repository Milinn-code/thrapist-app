import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: 新規登録処理
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      {/* ロゴ・タイトル */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-primary tracking-widest">Melty</h1>
        <p className="text-sm text-muted-foreground mt-2">新規アカウント登録</p>
      </div>

      {/* フォーム */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">お名前（ニックネーム可）</Label>
          <Input
            id="name"
            type="text"
            placeholder="例：さくら"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

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
            placeholder="8文字以上"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">パスワード（確認）</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="もう一度入力してください"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full">
          登録する
        </Button>
      </form>

      {/* ログインリンク */}
      <p className="mt-8 text-sm text-muted-foreground">
        すでにアカウントをお持ちの方は{' '}
        <Link to="/login" className="text-primary font-medium underline underline-offset-4">
          ログイン
        </Link>
      </p>
    </div>
  )
}
