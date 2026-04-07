# バックエンド 役割分担

最終更新: 2026-03-03

---

## 担当概要

| 担当  | 役割                                       | 工数比 |
| ----- | ------------------------------------------ | ------ |
| MTK   | Supabaseセットアップ・認証API・顧客管理API | 2      |
| Ryoga | DBスキーマ作成・来店管理API・収入管理API   | 1      |

> **工数比の考え方**
> 認証API（Supabase Auth連携・セキュリティ要件あり）と顧客管理API（アプリのコア機能）は複雑度が高いためMTKが担当。
> 来店・収入APIはCRUDが中心でシンプルなためRyogaが担当。

---

## MTKの担当

### Phase 1: Supabaseセットアップ（Ryogaと協力）

- [ ] Supabaseプロジェクトを作成する（リード）
  - プロジェクト名: `melty`、リージョン: `Northeast Asia (Tokyo)`
- [ ] `.env` に接続情報を設定する（`SUPABASE_URL` / `SUPABASE_KEY` / `SECRET_KEY`）
- [ ] `http://localhost:8000/health` でサーバー起動を確認する

### Phase 2: DBスキーマ設計（customersテーブル）

Supabaseのダッシュボードで以下のテーブルを作成する。

**customers（顧客）**

| カラム名    | 型          | 説明                     |
| ----------- | ----------- | ------------------------ |
| id          | uuid        | 主キー（auto-generate）  |
| user_id     | uuid        | 外部キー → auth.users.id |
| name        | text        | NOT NULL                 |
| group_color | text        | グループカラー           |
| rank        | text        | ランク（A / B / C / D）  |
| birthday    | date        | 誕生日                   |
| memo        | text        | メモ                     |
| created_at  | timestamptz | DEFAULT now()            |

> RLS（Row Level Security）を有効にし、`user_id = auth.uid()` のポリシーを設定すること。

### Phase 3: 認証API実装

ブランチ: `feature/auth-api`

| メソッド | URL            | 内容                             |
| -------- | -------------- | -------------------------------- |
| POST     | `/auth/signup` | 新規登録（メール・パスワード）   |
| POST     | `/auth/login`  | ログイン → アクセストークン返却  |
| POST     | `/auth/logout` | ログアウト                       |
| GET      | `/auth/me`     | 現在のユーザー情報取得（要認証） |

**実装ポイント**

- Supabase Auth の `sign_up` / `sign_in_with_password` を使う
- ログイン成功時は `access_token` と `refresh_token` をレスポンスに含める
- `/auth/me` は Authorization ヘッダーのトークンを検証して返す
- パスワードのハッシュ化はSupabase側が行うため自前実装不要

---

### Phase 3: 実装ガイド

#### 作成するファイル一覧

```
backend/app/
├── core/
│   ├── config.py       # .env の環境変数を読み込む
│   └── supabase.py     # Supabaseクライアントの初期化
├── schemas/
│   └── auth.py         # リクエスト・レスポンスの型定義
├── routers/
│   └── auth.py         # 認証エンドポイントの実装
└── main.py             # ルーターの登録（既存ファイルに追記）
```

---

#### Step 1: `app/core/config.py` を作成する

`pydantic_settings` の `BaseSettings` を継承したクラスを作り、`.env` から `supabase_url` / `supabase_key` / `secret_key` の3つを読み込む。
クラスの内部に `env_file = ".env"` を指定した `Config` クラスを定義すること。
最後にインスタンスを `settings` という名前でモジュールレベルに作っておく。

---

#### Step 2: `app/core/supabase.py` を作成する

`supabase` パッケージの `create_client` 関数を使って Supabase クライアントを初期化する。
引数には Step 1 で作った `settings.supabase_url` と `settings.supabase_key` を渡す。
作ったクライアントを `supabase` という名前でモジュールレベルに置いておく（他ファイルからインポートして使う）。

---

#### Step 3: `app/schemas/auth.py` を作成する

`pydantic` の `BaseModel` を継承して以下の3つのクラスを定義する。

| クラス名 | フィールド | 用途 |
| --- | --- | --- |
| `AuthRequest` | `email: EmailStr`, `password: str` | signup・login のリクエスト |
| `TokenResponse` | `access_token: str`, `refresh_token: str` | login のレスポンス |
| `UserResponse` | `id: str`, `email: str` | `/me` のレスポンス |

`EmailStr` は `pydantic` からインポートする。

---

#### Step 4: `app/routers/auth.py` を作成する

`APIRouter` のインスタンスを `router` という名前で作る。
各エンドポイントで使う Supabase Auth のメソッドは以下の通り。

| エンドポイント | 使うメソッド | 成功時に参照するプロパティ |
| --- | --- | --- |
| `POST /signup` | `supabase.auth.sign_up({"email": ..., "password": ...})` | `res.user` が `None` でなければ成功 |
| `POST /login` | `supabase.auth.sign_in_with_password({"email": ..., "password": ...})` | `res.session.access_token` / `res.session.refresh_token` |
| `POST /logout` | `supabase.auth.sign_out()` | なし |
| `GET /me` | `supabase.auth.get_user(token)` | `res.user.id` / `res.user.email` |

**`/logout` と `/me` でのトークン取り出し方**
- 関数の引数に `authorization: str = Header(...)` を受け取る
- `authorization.replace("Bearer ", "")` でトークン部分だけ取り出す

失敗時は `HTTPException` を raise する（signup は `400`、認証エラーは `401`）。

---

#### Step 5: `app/main.py` にルーターを登録する

`app.routers` から `auth` をインポートして、`app.include_router()` で登録する。
`prefix="/auth"` を指定することで、`router` 内のパスが `/auth/signup` などになる。

---

#### 動作確認

```bash
uvicorn app.main:app --reload
# → http://localhost:8000/docs を開く
```

1. `POST /auth/signup` でアカウント作成
2. `POST /auth/login` でログイン → `access_token` が返ってくることを確認
3. `GET /auth/me` の Authorize ボタンに `Bearer <access_token>` を貼り付けて実行
4. ユーザー情報が返ってくればOK

### Phase 4: 顧客管理API実装

ブランチ: `feature/customers-api`

| メソッド | URL               | 内容                                           |
| -------- | ----------------- | ---------------------------------------------- |
| GET      | `/customers`      | 顧客一覧（検索・ランク・グループ絞り込み対応） |
| POST     | `/customers`      | 顧客作成                                       |
| GET      | `/customers/{id}` | 顧客詳細                                       |
| PUT      | `/customers/{id}` | 顧客更新                                       |
| DELETE   | `/customers/{id}` | 顧客削除                                       |

**クエリパラメータ（一覧）**

| パラメータ    | 型     | 説明                                     |
| ------------- | ------ | ---------------------------------------- |
| `q`           | string | 名前で部分一致検索                       |
| `rank`        | string | ランク絞り込み（A/B/C/D）                |
| `group_color` | string | グループカラー絞り込み                   |
| `sort`        | string | 並び順（`name` / `rank` / `created_at`） |

**実装ポイント**

- 全エンドポイントで認証必須（`user_id` でデータを絞る）
- 他ユーザーのデータを取得・更新できないよう必ず `user_id` チェックを入れる

---

## Ryogaの担当

### Phase 1: Supabaseセットアップ（MTKと協力）

- [ ] MTKと並行して環境構築を行い、開発サーバーの起動まで確認する
- [ ] `http://localhost:8000/health` のレスポンスを確認する

### Phase 2: DBスキーマ設計（visits・incomesテーブル）

Supabaseのダッシュボードで以下のテーブルを作成する。

**visits（来店記録）**

| カラム名    | 型          | 説明                     |
| ----------- | ----------- | ------------------------ |
| id          | uuid        | 主キー（auto-generate）  |
| customer_id | uuid        | 外部キー → customers.id  |
| user_id     | uuid        | 外部キー → auth.users.id |
| visited_at  | timestamptz | 来店日時 NOT NULL        |
| sales       | integer     | 売上（円）               |
| sets        | numeric     | セット数                 |
| is_shimei   | boolean     | 指名フラグ DEFAULT false |
| is_douhan   | boolean     | 同伴フラグ DEFAULT false |
| note        | text        | 接客メモ                 |

**incomes（収入記録）**

| カラム名 | 型      | 説明                     |
| -------- | ------- | ------------------------ |
| id       | uuid    | 主キー（auto-generate）  |
| user_id  | uuid    | 外部キー → auth.users.id |
| date     | date    | 日付 NOT NULL            |
| amount   | integer | 金額（円） NOT NULL      |
| note     | text    | メモ                     |

> 両テーブルともRLS（Row Level Security）を有効にすること。

### Phase 3: 来店管理API実装

ブランチ: `feature/visits-api`

| メソッド | URL                               | 内容               |
| -------- | --------------------------------- | ------------------ |
| GET      | `/customers/{customer_id}/visits` | 来店一覧（顧客別） |
| POST     | `/customers/{customer_id}/visits` | 来店登録           |
| GET      | `/visits/{id}`                    | 来店詳細           |
| PUT      | `/visits/{id}`                    | 来店更新           |
| DELETE   | `/visits/{id}`                    | 来店削除           |

**実装ポイント**

- 来店登録前に `customer_id` が自分の顧客かチェックする
- 一覧は `visited_at` の降順で返す

### Phase 4: 収入管理API実装

ブランチ: `feature/income-api`

| メソッド | URL             | 内容     |
| -------- | --------------- | -------- |
| GET      | `/incomes`      | 収入一覧 |
| POST     | `/incomes`      | 収入記録 |
| GET      | `/incomes/{id}` | 収入詳細 |
| PUT      | `/incomes/{id}` | 収入更新 |
| DELETE   | `/incomes/{id}` | 収入削除 |

**クエリパラメータ（一覧）**

| パラメータ | 型   | 説明                 |
| ---------- | ---- | -------------------- |
| `from`     | date | 開始日（YYYY-MM-DD） |
| `to`       | date | 終了日（YYYY-MM-DD） |

---

## 作業フロー（共通）

```
1. main から feature/xxx ブランチを切る
2. 実装・ローカルで動作確認
3. GitHub に push して PR を作成
4. フロントエンド担当にレビュー依頼
5. 承認後にマージ
```

---

## 進行の目安

| フェーズ | MTK                            | Ryoga                       | 順序               |
| -------- | ------------------------------ | --------------------------- | ------------------ |
| Phase 1  | Supabaseセットアップ（リード） | セットアップ確認            | 同時               |
| Phase 2  | customersテーブル作成          | visits・incomesテーブル作成 | 同時               |
| Phase 3  | 認証API                        | 来店管理API                 | 同時（認証実装後） |
| Phase 4  | 顧客管理API                    | 収入管理API                 | 同時               |

> Phase 3以降はMTKの認証APIが完成してから着手してください（他APIで認証トークンの検証が必要なため）。

---

## 共有事項

- APIの仕様変更が必要な場合は**必ず事前にフロントエンド担当に相談**してください
- 不明点はお互いに気軽に相談してください
- 実装の参考: [`docs/backend-onboarding.md`](./backend-onboarding.md)
