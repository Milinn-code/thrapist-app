import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'

function RegisterHeader() {
  return (
    <div className="flex flex-col items-center gap-3">
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
        新規アカウント登録
      </p>
    </div>
  )
}

function PasswordField({
  id,
  label,
  placeholder,
  value,
  onChange,
  showPassword,
  onToggle,
  minLength,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  showPassword: boolean
  onToggle: () => void
  minLength?: number
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-foreground/80">
        {label}
      </Label>
      <div className="relative">
        <Lock
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 pl-10 pr-10 bg-muted/50 border-border/60 focus-visible:bg-card"
          required
          minLength={minLength}
        />
        <button
          type="button"
          onClick={onToggle}
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
  )
}

function RegisterForm({
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  onSubmit,
}: {
  name: string
  setName: (v: string) => void
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  confirmPassword: string
  setConfirmPassword: (v: string) => void
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  showConfirmPassword: boolean
  setShowConfirmPassword: (v: boolean) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* お名前 */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="name" className="text-foreground/80">
          {'お名前（ニックネーム可）'}
        </Label>
        <div className="relative">
          <User
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="name"
            type="text"
            placeholder="例：さくら"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 pl-10 bg-muted/50 border-border/60 focus-visible:bg-card"
            required
          />
        </div>
      </div>

      {/* メールアドレス */}
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

      {/* パスワード */}
      <PasswordField
        id="password"
        label="パスワード（8文字以上）"
        placeholder="8文字以上で入力"
        value={password}
        onChange={setPassword}
        showPassword={showPassword}
        onToggle={() => setShowPassword(!showPassword)}
        minLength={8}
      />

      {/* パスワード確認 */}
      <PasswordField
        id="confirmPassword"
        label="パスワード（確認）"
        placeholder="もう一度入力してください"
        value={confirmPassword}
        onChange={setConfirmPassword}
        showPassword={showConfirmPassword}
        onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
      />

      <Button type="submit" size="lg" className="w-full h-11 text-base font-semibold mt-1">
        登録する
      </Button>
    </form>
  )
}

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: 新規登録処理
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
        <RegisterHeader />

        {/* 登録カード */}
        <Card className="w-full border-border/50 shadow-lg shadow-primary/5">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg text-foreground">はじめまして</CardTitle>
            <CardDescription>
              下記の情報を入力してアカウントを作成してください
            </CardDescription>
          </CardHeader>

          <CardContent>
            <RegisterForm
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>

        {/* ログインリンク */}
        <p className="text-sm text-muted-foreground">
          {'すでにアカウントをお持ちの方は '}
          <Link
            to="/login"
            className="font-semibold text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
          >
            ログイン
          </Link>
        </p>
      </div>
    </main>
  )
}
