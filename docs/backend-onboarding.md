# バックエンドチーム 参加ガイド

---

## はじめに

プロジェクトへの参加ありがとうございます。
このドキュメントでは、開発に参加するための環境構築手順と、最初に取り組んでもらいたい作業をまとめています。

---

## プロジェクト概要

水商売従事者（ホステスなど）向けの顧客管理PWAアプリ「Melty」を開発しています。

詳細は [`docs/progress.md`](./progress.md) を参照してください。

---

## チーム構成

| 役割 | 担当 |
|---|---|
| フロントエンド | React + TypeScript + Vite PWA |
| バックエンド（担当） | Python + FastAPI |

---

## リポジトリ

```
https://github.com/Milinn-code/therapist-app
```

### クローン

```bash
git clone https://github.com/Milinn-code/therapist-app.git
cd therapist-app
```

---

## 環境構築手順

### 1. 必要なもの

- Python 3.11 以上
- pip

Pythonのバージョン確認:
```bash
python --version
```

### 2. 仮想環境の作成と有効化

```bash
cd backend
python -m venv .venv
```

**Mac / Linux:**
```bash
source .venv/bin/activate
```

**Windows:**
```bash
.venv\Scripts\activate
```

### 3. 依存パッケージのインストール

```bash
pip install -r requirements.txt
```

### 4. 環境変数の設定

```bash
cp .env.example .env
```

`.env` を開いて以下を設定します（後述のSupabase作成後に入力）:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SECRET_KEY=任意の長いランダム文字列
```

### 5. 開発サーバーの起動

```bash
uvicorn app.main:app --reload
```

起動後、以下のURLでAPI仕様書（Swagger UI）が確認できます:
```
http://localhost:8000/docs
```

---

## Supabaseのセットアップ

Supabase はデータベース（PostgreSQL）と認証を担うサービスです。

### 1. アカウント作成・プロジェクト作成

1. https://supabase.com にアクセスしてアカウント作成
2. 「New Project」をクリック
3. プロジェクト名: `melty`、リージョン: `Northeast Asia (Tokyo)` を選択

### 2. 接続情報の取得

プロジェクト作成後、**Project Settings → API** から以下をコピーして `.env` に設定:

| 項目 | .envの変数名 |
|---|---|
| Project URL | `SUPABASE_URL` |
| anon public key | `SUPABASE_KEY` |

---

## フォルダ構成

```
backend/
├── app/
│   ├── main.py        # FastAPIのエントリーポイント・起動設定
│   ├── routers/       # エンドポイント定義（機能ごとにファイルを分ける）
│   ├── models/        # DBモデル
│   ├── schemas/       # リクエスト・レスポンスの型定義
│   └── core/          # 認証・設定などの共通処理
├── requirements.txt
└── .env.example
```

### ファイルの追加ルール

エンドポイントを追加するときは `routers/` にファイルを作成してください。

例: 顧客管理APIなら `routers/customers.py` を作成し、`main.py` でインポートします。

---

## API仕様書

`docs/openapi.yaml` にAPI仕様のスケルトンがあります。
新しいエンドポイントを実装する前に、フロントエンド担当と仕様を合意してから開発を始めてください。

FastAPIはコードからSwagger UIを自動生成するため、実装後は `http://localhost:8000/docs` で確認できます。

---

## 最初に取り組んでもらいたいこと

以下の順番で進めてください。

### Step 1: 環境構築の確認

`http://localhost:8000/health` にアクセスして以下が返ってくればOKです:

```json
{ "status": "ok" }
```

### Step 2: Supabaseプロジェクトの作成

上記の手順でSupabaseを作成し、接続を確認してください。

### Step 3: DBテーブル設計

以下のテーブルを設計・作成してください（Supabaseのダッシュボードで作成できます）。

**users（ユーザー）**
※ Supabase Authが自動管理するため、基本的に追加作業不要

**customers（顧客）**

| カラム名 | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| user_id | uuid | ユーザーID（外部キー） |
| name | text | 顧客名 |
| group_color | text | グループカラー |
| rank | text | ランク（A/B/C/D） |
| birthday | date | 誕生日 |
| memo | text | メモ |
| created_at | timestamp | 作成日時 |

**visits（来店記録）**

| カラム名 | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| customer_id | uuid | 顧客ID（外部キー） |
| user_id | uuid | ユーザーID |
| visited_at | timestamp | 来店日時 |
| sales | integer | 売上（円） |
| sets | numeric | セット数 |
| is_shimei | boolean | 指名フラグ |
| is_douhan | boolean | 同伴フラグ |
| note | text | 接客メモ |

**incomes（収入記録）**

| カラム名 | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| user_id | uuid | ユーザーID |
| date | date | 日付 |
| amount | integer | 金額（円） |
| note | text | メモ |

### Step 4: 認証APIの実装

最初に実装するエンドポイントです。

| メソッド | URL | 内容 |
|---|---|---|
| POST | `/auth/signup` | 新規登録 |
| POST | `/auth/login` | ログイン |
| POST | `/auth/logout` | ログアウト |
| GET | `/auth/me` | 現在のユーザー情報取得 |

---

## ブランチ・PR運用

| 作業内容 | ブランチ名の例 |
|---|---|
| 認証API | `feature/auth-api` |
| 顧客管理API | `feature/customers-api` |
| 来店管理API | `feature/visits-api` |

```bash
# ブランチを作成して作業
git checkout -b feature/auth-api

# 作業後にプッシュ
git push origin feature/auth-api

# GitHubでPRを作成してレビュー後にマージ
```

---

## 質問・相談

わからないことがあればフロントエンド担当に気軽に相談してください。
API仕様に関わる変更は必ず事前に共有して合意を取ってから実装をお願いします。
