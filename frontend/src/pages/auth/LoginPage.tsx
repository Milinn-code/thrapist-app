import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

function LoginHeader() {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* ロゴマーク */}
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
        <svg
          viewBox="0 0 32 32"
          className="size-8 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M16 4c-4 6-10 8-10 16a10 10 0 0020 0c0-8-6-10-10-16z" />
          <path d="M16 28c-2-3-5-4-5-8a5 5 0 0110 0c0 4-3 5-5 8z" opacity="0.5" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold tracking-widest text-primary">Melty</h1>
      <p className="text-sm text-muted-foreground">
        顧客管理をもっとスマートに
      </p>
    </div>
  )
}

function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  onSubmit,
}: {
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-foreground/80">
          メールアドレス
        </Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 pl-10 bg-muted/50 border-border/60 focus-visible:bg-card"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-foreground/80">
            パスワード
          </Label>
          <button
            type="button"
            className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
          >
            パスワードを忘れた方
          </button>
        </div>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="パスワードを入力"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 pl-10 pr-10 bg-muted/50 border-border/60 focus-visible:bg-card"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full h-11 text-base font-semibold mt-1">
        ログイン
      </Button>
    </form>
  )
}

function SocialLoginButtons() {
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">または</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="flex flex-col gap-3">
        <Button variant="outline" className="w-full h-11 gap-2 text-foreground/80" disabled>
          <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {'Google\u3067\u30ED\u30B0\u30A4\u30F3\uFF08\u6E96\u5099\u4E2D\uFF09'}
        </Button>
        <Button variant="outline" className="w-full h-11 gap-2 text-foreground/80" disabled>
          <svg className="size-4" viewBox="0 0 24 24" fill="#06C755" aria-hidden="true">
            <path d="M12 2C6.48 2 2 5.82 2 10.5c0 2.95 1.93 5.55 4.83 7.13-.17.63-.63 2.3-.72 2.65-.12.44.16.43.34.31.14-.09 2.2-1.5 3.1-2.11.47.07.96.1 1.45.1 5.52 0 10-3.82 10-8.5S17.52 2 12 2z" />
          </svg>
          {'LINE\u3067\u30ED\u30B0\u30A4\u30F3\uFF08\u6E96\u5099\u4E2D\uFF09'}
        </Button>
      </div>
    </>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: 認証処理
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-8">
      {/* 装飾用の背景円 */}
      <div
        className="pointer-events-none fixed -top-32 -right-32 size-80 rounded-full bg-primary/5"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-24 -left-24 size-64 rounded-full bg-accent/40"
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        {/* ヘッダー */}
        <LoginHeader />

        {/* ログインカード */}
        <Card className="w-full border-border/50 shadow-lg shadow-primary/5">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg text-foreground">おかえりなさい</CardTitle>
            <CardDescription>
              アカウント情報を入力してログインしてください
            </CardDescription>
          </CardHeader>

          <CardContent>
            <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              onSubmit={handleSubmit}
            />
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <SocialLoginButtons />
          </CardFooter>
        </Card>

        {/* 新規登録リンク */}
        <p className="text-sm text-muted-foreground">
          {'アカウントをお持ちでない方は '}
          <Link
            to="/register"
            className="font-semibold text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
          >
            新規登録
          </Link>
        </p>
      </div>
    </main>
  )
}
