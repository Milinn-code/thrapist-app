# Melty

水商売向け顧客管理PWAアプリ

## 構成

```
therapist-app/
├── frontend/       # React + TypeScript + Vite PWA
├── backend/        # Python + FastAPI
├── docs/           # API仕様書（OpenAPI）
└── docker-compose.yml
```

## ローカル開発環境のセットアップ

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

### バックエンド

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

## 技術スタック

| 領域 | 技術 |
|---|---|
| フロントエンド | React + TypeScript + Vite + PWA |
| バックエンド | Python + FastAPI |
| データベース | PostgreSQL（Supabase） |
| 認証 | Supabase Auth |
| FEデプロイ | Vercel |
| BEデプロイ | Render |
