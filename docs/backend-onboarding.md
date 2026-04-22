# バックエンドチーム 参加ガイド

---

## このドキュメントについて

**まずこのファイルを読んでください。** 環境構築の手順と、チーム共通のルールをまとめています。

個人の担当タスクとAPIの実装手順は [`docs/backend-roles.md`](./backend-roles.md) を参照してください。

---

## プロジェクト概要

水商売従事者（ホステスなど）向けの顧客管理PWAアプリ「Melty」を開発しています。

詳細は [`docs/progress.md`](./progress.md) を参照してください。

---

## チーム構成

| 役割 | 担当 |
|---|---|
| フロントエンド | React + TypeScript + Vite PWA |
| バックエンド（MTK） | Supabaseセットアップ・認証API・顧客管理API |
| バックエンド（Ryoga） | DBスキーマ作成・来店管理API・収入管理API |

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

起動確認: `http://localhost:8000/health` にアクセスして以下が返ってくればOKです。

```json
{ "status": "ok" }
```

---

## Supabaseのセットアップ

SupabaseはデータベースとSupabase Auth（認証）を担うサービスです。MTK・Ryogaで共同で1つのプロジェクトを使います。

### 1. プロジェクト作成（MTKが実施・Ryogaは設定値を受け取る）

1. https://supabase.com にアクセスしてアカウント作成
2. 「New Project」をクリック
3. プロジェクト名: `melty`、リージョン: `Northeast Asia (Tokyo)` を選択

### 2. 接続情報の取得と共有

プロジェクト作成後、**Project Settings → API** から以下をコピーする。

| 項目 | .envの変数名 |
|---|---|
| Project URL | `SUPABASE_URL` |
| anon public key | `SUPABASE_KEY` |

> **注意:** 接続情報は `.env.example` に書かず、**Bitwarden**（パスワードマネージャー）でチーム内共有してください。詳細は [`docs/security-incident-2026-03-23.md`](./security-incident-2026-03-23.md) を参照。

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

エンドポイントを追加するときは `routers/` にファイルを作成してください。

例: 顧客管理APIなら `routers/customers.py` を作成し、`main.py` でインポートします。

---

## API仕様書

`docs/openapi.yaml` にAPI仕様のスケルトンがあります。
新しいエンドポイントを実装する前に、フロントエンド担当と仕様を合意してから開発を始めてください。

FastAPIはコードからSwagger UIを自動生成するため、実装後は `http://localhost:8000/docs` で確認できます。

---

## ブランチ・PR運用

| 作業内容 | ブランチ名 |
|---|---|
| 認証API | `feature/auth-api` |
| 顧客管理API | `feature/customers-api` |
| 来店管理API | `feature/visits-api` |
| 収入管理API | `feature/income-api` |

```bash
# ブランチを作成して作業
git checkout -b feature/auth-api

# 作業後にプッシュ
git push origin feature/auth-api

# GitHubでPRを作成してレビュー後にマージ
```

作業フロー:
```
1. main から feature/xxx ブランチを切る
2. 実装・ローカルで動作確認
3. GitHub に push して PR を作成
4. フロントエンド担当にレビュー依頼
5. 承認後にマージ
```

---

## 質問・相談

わからないことがあればフロントエンド担当に気軽に相談してください。
API仕様に関わる変更は必ず事前に共有して合意を取ってから実装をお願いします。
