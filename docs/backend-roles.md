# バックエンド 役割分担

最終更新: 2026-04-22

---

## このドキュメントについて

環境構築が完了したら次にこのファイルを読んでください。
あなたの担当フェーズを確認して、順番に進めてください。

> 環境構築の手順は [`docs/backend-onboarding.md`](./backend-onboarding.md) を参照してください。

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

## 進行の目安

| フェーズ | MTK                            | Ryoga                       | 順序               |
| -------- | ------------------------------ | --------------------------- | ------------------ |
| Phase 1  | Supabaseセットアップ（リード） | セットアップ確認            | 同時               |
| Phase 2  | customersテーブル作成          | visits・incomesテーブル作成 | 同時               |
| Phase 3  | 認証API                        | 来店管理API                 | 同時（認証実装後） |
| Phase 4  | 顧客管理API                    | 収入管理API                 | 同時               |

> **注意:** Phase 3以降はMTKの認証APIが完成してから着手してください（他のAPIで認証トークンの検証が必要なため）。

---

---

# MTKの担当

## Phase 1: Supabaseセットアップ

### このフェーズでやること

Supabaseのプロジェクトを作成し、バックエンドサーバーが起動できる状態にします。

### `.env` ファイルとは

`.env` はアプリが使う「秘密の設定値」をまとめたファイルです。
パスワードやAPIキーなど外部に漏らしてはいけない情報をここに書き、Gitには含めません（`.gitignore` で除外済み）。

```
SUPABASE_URL=https://xxxx.supabase.co      # SupabaseのプロジェクトURL
SUPABASE_KEY=eyJhbGciOiJI...               # anon public key（RLSで保護された操作専用。GitやSlackに書かない）
SECRET_KEY=a3f8b2c1...                     # JWTの署名に使う秘密鍵（自分で生成する）
```

> **重要:** `SUPABASE_KEY` は "anon public key" です。フロントエンドでも使われますが、バックエンドでも `.env` 外には絶対に書かないでください。将来 `service_role` キーが必要になっても同様です（`service_role` はすべての RLS を無視するため特に危険です）。

### 手順

**1. Supabaseプロジェクトを作成する**

1. https://supabase.com にアクセスしてログイン
2. 「New Project」をクリック
3. 以下を入力して作成：
   - Project name: `melty`
   - Region: `Northeast Asia (Tokyo)`
   - Database password: 任意の強いパスワード（メモしておく）

**2. 接続情報を取得して `.env` に設定する**

1. ダッシュボード左メニューの「Project Settings」→「API」を開く
2. 以下の2つをコピーして `.env` に貼り付ける：

| Supabase画面の項目 | `.env` の変数名 |
| ------------------ | --------------- |
| Project URL        | `SUPABASE_URL`  |
| anon public        | `SUPABASE_KEY`  |

**3. `SECRET_KEY` を生成して `.env` に設定する**

`SECRET_KEY` はJWT（後述）の署名に使う秘密鍵です。以下のコマンドで生成できます：

```bash
openssl rand -hex 32
```

出力された文字列をそのまま `SECRET_KEY=` の右側に貼り付けてください。

> 接続情報はチームメンバーへ **Bitwarden**（パスワードマネージャー）で共有してください。
> Slackやメールでの共有は禁止です。

**4. サーバーの起動を確認する**

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

ブラウザで `http://localhost:8000/health` を開いて以下が表示されればOKです：

```json
{ "status": "ok" }
```

---

## Phase 2: DBスキーマ設計（customersテーブル）

### このフェーズでやること

Supabaseのダッシュボードで `customers` テーブルを作成します。
テーブルとはデータベースにおける「表」のことで、Excelのシートのようなものです。

### カラムの型について

| 型          | 意味                              | 例                                       |
| ----------- | --------------------------------- | ---------------------------------------- |
| uuid        | 一意のID（自動生成）              | `a3f2-...`                               |
| text        | 文字列                            | `"田中太郎"`                             |
| date        | 日付（時刻なし）                  | `2000-01-01`                             |
| timestamptz | 日時（タイムゾーン付き）          | `2026-03-01 10:00:00+09`                 |

### テーブルの作成手順

1. Supabaseダッシュボード左メニューの「Table Editor」を開く
2. 「New table」をクリック
3. **Table name** に `customers` と入力
4. 「Enable Row Level Security (RLS)」を**オン**にする（重要）
5. 以下のカラムを追加する（「Add column」ボタンで1つずつ追加）：

| カラム名    | Type        | Default value | その他の設定        |
| ----------- | ----------- | ------------- | ------------------- |
| user_id     | uuid        | なし          | NOT NULL にチェック |
| name        | text        | なし          | NOT NULL にチェック |
| group_color | text        | なし          | -                   |
| rank        | text        | なし          | -                   |
| birthday    | date        | なし          | -                   |
| memo        | text        | なし          | -                   |
| created_at  | timestamptz | `now()`       | -                   |

> `id` カラムは Supabase が自動で作成するため追加不要です。

6. 「Save」をクリックしてテーブルを保存する

### RLSポリシーの設定

**RLS（Row Level Security）とは:** 「自分のデータだけを見られる」仕組みです。
RLSを使わないと、ユーザーAがユーザーBのデータを取得・削除できてしまいます。

設定手順：

1. 左メニューの「Authentication」→「Policies」を開く
2. `customers` テーブルを探して「New Policy」をクリック
3. 「Create a policy from scratch」を選択
4. 以下の内容で4つのポリシーを作成する：

| Policy name        | Allowed operation | 式の種類    | 式                     |
| ------------------ | ----------------- | ----------- | ---------------------- |
| Users can select   | SELECT            | USING       | `user_id = auth.uid()` |
| Users can insert   | INSERT            | WITH CHECK  | `user_id = auth.uid()` |
| Users can update   | UPDATE            | USING       | `user_id = auth.uid()` |
| Users can update   | UPDATE            | WITH CHECK  | `user_id = auth.uid()` |
| Users can delete   | DELETE            | USING       | `user_id = auth.uid()` |

> - `auth.uid()` はログイン中のユーザーのIDを返す Supabase の組み込み関数です。
> - **USING** は既存の行に対して「読み書きできるか」をチェックします（SELECT / UPDATE / DELETE）。
> - **WITH CHECK** は新しく書き込む行に対して「挿入・更新してよいか」をチェックします（INSERT / UPDATE）。
> - UPDATEは USING と WITH CHECK の両方を設定することで、「自分のデータだけを」「自分のデータとして」更新できるようになります。
> - ダッシュボードで操作を選ぶと、それに対応した入力欄が表示されます。

---

## Phase 3: 認証API実装

### このフェーズでやること

ユーザーがサインアップ・ログインできるAPIを実装します。
このAPIが完成すると、フロントエンドからログインできるようになります。

### 用語説明

- **アクセストークン（JWT）**: ログイン成功後に発行される「ログイン済み証明書」のようなもの。文字列で、フロントエンドはこれをAPIリクエストのたびに送ります。
- **Bearer認証**: アクセストークンをリクエストのヘッダーに `Authorization: Bearer <トークン>` という形で付けて送る認証方式です。

ブランチ: `feature/auth-api`

### 実装するエンドポイント

| メソッド | URL            | 内容                             |
| -------- | -------------- | -------------------------------- |
| POST     | `/auth/signup` | 新規登録（メール・パスワード）   |
| POST     | `/auth/login`  | ログイン → アクセストークン返却  |
| POST     | `/auth/logout` | ログアウト                       |
| GET      | `/auth/me`     | 現在のユーザー情報取得（要認証） |

### 作成するファイル

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

### ステップ別実装ガイド

#### Step 1: `app/core/config.py` を作成する

`.env` の値をPythonから読み込むための設定クラスを作ります。

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    supabase_url: str
    supabase_key: str
    secret_key: str

settings = Settings()
```

---

#### Step 2: `app/core/supabase.py` を作成する

Supabaseと通信するためのクライアントを初期化します。
他のファイルからは `from app.core.supabase import supabase` でインポートして使います。

```python
from supabase import create_client
from app.core.config import settings

supabase = create_client(settings.supabase_url, settings.supabase_key)
```

---

#### Step 3: `app/schemas/auth.py` を作成する

APIのリクエストとレスポンスの「型」を定義します。
Pydanticを使うと、送られてきたデータの型チェックを自動でやってくれます。

```python
from pydantic import BaseModel, EmailStr

class AuthRequest(BaseModel):
    email: EmailStr   # メール形式かどうかを自動でチェックしてくれる
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str

class UserResponse(BaseModel):
    id: str
    email: str
```

> **注意:** `EmailStr` を使うには `pydantic[email]` パッケージが必要です。`requirements.txt` にすでに含まれていますが、もし `ImportError` が出たら `pip install pydantic[email]` を実行してください。

---

#### Step 4: `app/routers/auth.py` を作成する

実際のエンドポイント（URLと処理）を実装します。

```python
from fastapi import APIRouter, HTTPException, Header
from app.core.supabase import supabase
from app.schemas.auth import AuthRequest, TokenResponse, UserResponse

router = APIRouter()


def extract_token(authorization: str) -> str:
    """Authorization ヘッダーからトークンを安全に取り出す"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="認証が必要です")
    return authorization[len("Bearer "):]


@router.post("/signup")
def signup(body: AuthRequest):
    res = supabase.auth.sign_up({"email": body.email, "password": body.password})
    if res.user is None:
        raise HTTPException(status_code=400, detail="登録に失敗しました")
    return {"message": "登録メールを送信しました。メールを確認してください。"}


@router.post("/login", response_model=TokenResponse)
def login(body: AuthRequest):
    res = supabase.auth.sign_in_with_password({"email": body.email, "password": body.password})
    if res.session is None:
        raise HTTPException(status_code=401, detail="メールアドレスまたはパスワードが正しくありません")
    return TokenResponse(
        access_token=res.session.access_token,
        refresh_token=res.session.refresh_token,
    )


@router.post("/logout")
def logout(authorization: str = Header(...)):
    token = extract_token(authorization)
    # ユーザーのトークンを使って、そのセッションをサーバー側で無効化する
    supabase.auth.admin.sign_out(token)
    return {"message": "ログアウトしました"}


@router.get("/me", response_model=UserResponse)
def me(authorization: str = Header(...)):
    token = extract_token(authorization)
    res = supabase.auth.get_user(token)
    if res.user is None:
        raise HTTPException(status_code=401, detail="認証が必要です")
    return UserResponse(id=res.user.id, email=res.user.email)
```

---

#### Step 5: `app/main.py` にルーターを登録する

作成したルーターをFastAPIアプリに組み込みます。
`prefix="/auth"` を付けることで、`router` 内の `/signup` が `/auth/signup` というURLになります。

```python
# main.py の既存コードに以下を追記する

from app.routers import auth

app.include_router(auth.router, prefix="/auth", tags=["auth"])
```

---

#### 動作確認

```bash
uvicorn app.main:app --reload
```

ブラウザで `http://localhost:8000/docs` を開くと、Swagger UIという操作画面が表示されます。

1. `POST /auth/signup` を開いて「Try it out」→ メールとパスワードを入力して実行
2. `POST /auth/login` を実行 → レスポンスに `access_token` が含まれていることを確認
3. 画面右上の「Authorize」ボタンをクリックし、`Bearer <access_token>` を入力
4. `GET /auth/me` を実行 → ユーザー情報が返ってくればOK

---

## Phase 4: 顧客管理API実装

### このフェーズでやること

顧客データを作成・取得・更新・削除するAPIを実装します。
このようなデータ操作の4つをまとめて **CRUD**（クラッド）と呼びます。

ブランチ: `feature/customers-api`

### 実装するエンドポイント

| メソッド | URL               | 内容                                           |
| -------- | ----------------- | ---------------------------------------------- |
| GET      | `/customers`      | 顧客一覧（検索・ランク・グループ絞り込み対応） |
| POST     | `/customers`      | 顧客作成                                       |
| GET      | `/customers/{id}` | 顧客詳細                                       |
| PUT      | `/customers/{id}` | 顧客更新                                       |
| DELETE   | `/customers/{id}` | 顧客削除                                       |

### クエリパラメータ（一覧）

クエリパラメータとはURLの末尾に `?` で付ける絞り込み条件のことです。
例: `/customers?rank=A&sort=name`

| パラメータ    | 型     | 説明                                     |
| ------------- | ------ | ---------------------------------------- |
| `q`           | string | 名前で部分一致検索                       |
| `rank`        | string | ランク絞り込み（A/B/C/D）                |
| `group_color` | string | グループカラー絞り込み                   |
| `sort`        | string | 並び順（`name` / `rank` / `created_at`） |

### 作成するファイル

```
backend/app/
├── core/
│   └── auth.py         # トークン検証の共通処理（全ルーターで使う）
├── schemas/
│   └── customer.py     # 顧客のリクエスト・レスポンスの型定義
└── routers/
    └── customers.py    # 顧客管理エンドポイントの実装
```

### ステップ別実装ガイド

#### Step 0: `app/core/auth.py` を作成する（全ルーター共通）

トークン検証の処理を1か所にまとめておきます。こうすることで、同じコードを何度も書かずに済み、修正が必要になったときも1か所直すだけで済みます。

```python
from fastapi import HTTPException
from app.core.supabase import supabase


def get_user_id(authorization: str) -> str:
    """Authorization ヘッダーを受け取り、ログイン中ユーザーの ID を返す"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="認証が必要です")
    token = authorization[len("Bearer "):]
    res = supabase.auth.get_user(token)
    if res.user is None:
        raise HTTPException(status_code=401, detail="認証が必要です")
    return res.user.id
```

> このファイルを作ったら、以降のすべてのルーターで `from app.core.auth import get_user_id` でインポートして使ってください。

---

#### Step 1: `app/schemas/customer.py` を作成する

```python
from pydantic import BaseModel
from datetime import date
from typing import Literal, Optional
import uuid


class CustomerCreate(BaseModel):
    name: str
    group_color: Optional[str] = None
    rank: Optional[Literal["A", "B", "C", "D"]] = None   # A〜D 以外は受け付けない
    birthday: Optional[date] = None
    memo: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    group_color: Optional[str] = None
    rank: Optional[Literal["A", "B", "C", "D"]] = None
    birthday: Optional[date] = None
    memo: Optional[str] = None


class CustomerResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    group_color: Optional[str] = None
    rank: Optional[str] = None
    birthday: Optional[date] = None
    memo: Optional[str] = None
```

---

#### Step 2: `app/routers/customers.py` を作成する

全エンドポイントで認証が必要です。
`get_user_id` で取得した `user_id` を使って、自分のデータだけを操作します。

```python
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from app.core.supabase import supabase
from app.core.auth import get_user_id
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse

router = APIRouter()

ALLOWED_SORT_COLUMNS = {"name", "rank", "created_at"}


@router.get("/customers")
def list_customers(
    authorization: str = Header(...),
    q: Optional[str] = None,
    rank: Optional[str] = None,
    group_color: Optional[str] = None,
    sort: Optional[str] = "created_at",
):
    user_id = get_user_id(authorization)

    # sort パラメータは許可されたカラム名のみ受け付ける（意図しない値を弾く）
    if sort not in ALLOWED_SORT_COLUMNS:
        raise HTTPException(status_code=400, detail=f"sort は {ALLOWED_SORT_COLUMNS} のいずれかを指定してください")

    query = supabase.table("customers").select("*").eq("user_id", user_id)

    if q:
        query = query.ilike("name", f"%{q}%")
    if rank:
        query = query.eq("rank", rank)
    if group_color:
        query = query.eq("group_color", group_color)

    return query.order(sort).execute().data


@router.post("/customers", response_model=CustomerResponse)
def create_customer(body: CustomerCreate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    # mode="json" を付けると date 型などが JSON シリアライズ可能な文字列に変換される
    data = body.model_dump(mode="json")
    data["user_id"] = user_id
    res = supabase.table("customers").insert(data).execute()
    return res.data[0]


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    res = (
        supabase.table("customers")
        .select("*")
        .eq("id", customer_id)
        .eq("user_id", user_id)   # 自分のデータだけ取得
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="顧客が見つかりません")
    return res.data[0]


@router.put("/customers/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: str, body: CustomerUpdate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    existing = (
        supabase.table("customers")
        .select("id")
        .eq("id", customer_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="顧客が見つかりません")

    data = {k: v for k, v in body.model_dump(mode="json").items() if v is not None}
    res = (
        supabase.table("customers")
        .update(data)
        .eq("id", customer_id)
        .eq("user_id", user_id)   # UPDATE にも必ず user_id フィルタを付ける
        .execute()
    )
    return res.data[0]


@router.delete("/customers/{customer_id}")
def delete_customer(customer_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    existing = (
        supabase.table("customers")
        .select("id")
        .eq("id", customer_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="顧客が見つかりません")

    supabase.table("customers").delete().eq("id", customer_id).eq("user_id", user_id).execute()
    return {"message": "削除しました"}
```

---

#### Step 3: `app/main.py` にルーターを登録する

```python
from app.routers import customers

app.include_router(customers.router, tags=["customers"])
```

---

#### 動作確認

`http://localhost:8000/docs` を開いて以下の順番で確認します：

1. `POST /auth/login` でログインしてトークンを取得
2. 「Authorize」ボタンに `Bearer <access_token>` を入力
3. `POST /customers` で顧客を1件作成
4. `GET /customers` で一覧が返ってくることを確認
5. `GET /customers/{id}` に作成した顧客のIDを入れて詳細が返ってくることを確認

---

---

# Ryogaの担当

## Phase 1: Supabaseセットアップ

### このフェーズでやること

MTKが作成したSupabaseプロジェクトに接続し、バックエンドサーバーが起動できる状態にします。

### 手順

1. MTKから **Bitwarden** 経由で以下の接続情報を受け取る：
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SECRET_KEY`

2. `backend/.env` に設定する：

```
SUPABASE_URL=MTKから受け取ったURL
SUPABASE_KEY=MTKから受け取ったキー
SECRET_KEY=MTKから受け取ったシークレット
```

3. サーバーを起動して確認する：

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

4. `http://localhost:8000/health` を開いて以下が表示されればOK：

```json
{ "status": "ok" }
```

---

## Phase 2: DBスキーマ設計（visits・incomesテーブル）

### このフェーズでやること

来店記録と収入記録のテーブルを作成します。
Supabaseダッシュボードで操作します（MTKのPhase 2と同じ手順です）。

### テーブルの作成手順（共通）

1. Supabaseダッシュボード左メニューの「Table Editor」を開く
2. 「New table」をクリック
3. テーブル名を入力し「Enable Row Level Security (RLS)」を**オン**にする
4. 以下のカラムを追加して「Save」

### visitsテーブル（来店記録）

| カラム名    | Type        | Default value | その他の設定         |
| ----------- | ----------- | ------------- | -------------------- |
| customer_id | uuid        | なし          | NOT NULL にチェック  |
| user_id     | uuid        | なし          | NOT NULL にチェック  |
| visited_at  | timestamptz | なし          | NOT NULL にチェック  |
| sales       | int4        | なし          | -                    |
| sets        | numeric     | なし          | -                    |
| is_shimei   | bool        | `false`       | -                    |
| is_douhan   | bool        | `false`       | -                    |
| note        | text        | なし          | -                    |

### incomesテーブル（収入記録）

| カラム名 | Type  | Default value | その他の設定        |
| -------- | ----- | ------------- | ------------------- |
| user_id  | uuid  | なし          | NOT NULL にチェック |
| date     | date  | なし          | NOT NULL にチェック |
| amount   | int4  | なし          | NOT NULL にチェック |
| note     | text  | なし          | -                   |

### RLSポリシーの設定

MTKのPhase 2と同じ手順で、`visits` と `incomes` 両テーブルにポリシーを設定します。

「Authentication」→「Policies」を開き、各テーブルに以下のポリシーを作成してください：

| Policy name        | Allowed operation | 式の種類   | 式                     |
| ------------------ | ----------------- | ---------- | ---------------------- |
| Users can select   | SELECT            | USING      | `user_id = auth.uid()` |
| Users can insert   | INSERT            | WITH CHECK | `user_id = auth.uid()` |
| Users can update   | UPDATE            | USING      | `user_id = auth.uid()` |
| Users can update   | UPDATE            | WITH CHECK | `user_id = auth.uid()` |
| Users can delete   | DELETE            | USING      | `user_id = auth.uid()` |

---

## Phase 3: 来店管理API実装

> **注意:** MTKのPhase 3（認証API）が完成してから着手してください。

### このフェーズでやること

顧客ごとの来店記録を管理するAPIを実装します。
認証の仕組みはMTKが実装済みのものを使います。

ブランチ: `feature/visits-api`

### 実装するエンドポイント

| メソッド | URL                               | 内容               |
| -------- | --------------------------------- | ------------------ |
| GET      | `/customers/{customer_id}/visits` | 来店一覧（顧客別） |
| POST     | `/customers/{customer_id}/visits` | 来店登録           |
| GET      | `/visits/{id}`                    | 来店詳細           |
| PUT      | `/visits/{id}`                    | 来店更新           |
| DELETE   | `/visits/{id}`                    | 来店削除           |

### 作成するファイル

```
backend/app/
├── schemas/
│   └── visit.py        # 来店のリクエスト・レスポンスの型定義
└── routers/
    └── visits.py       # 来店管理エンドポイントの実装
```

### ステップ別実装ガイド

#### Step 1: `app/schemas/visit.py` を作成する

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import uuid


class VisitCreate(BaseModel):
    visited_at: datetime
    sales: Optional[int] = None
    sets: Optional[float] = None
    is_shimei: bool = False
    is_douhan: bool = False
    note: Optional[str] = None


class VisitUpdate(BaseModel):
    visited_at: Optional[datetime] = None
    sales: Optional[int] = None
    sets: Optional[float] = None
    is_shimei: Optional[bool] = None
    is_douhan: Optional[bool] = None
    note: Optional[str] = None


class VisitResponse(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    user_id: uuid.UUID
    visited_at: datetime
    sales: Optional[int] = None
    sets: Optional[float] = None
    is_shimei: bool
    is_douhan: bool
    note: Optional[str] = None
```

---

#### Step 2: `app/routers/visits.py` を作成する

`get_user_id` は MTK が作成した `app/core/auth.py` からインポートします。

```python
from fastapi import APIRouter, HTTPException, Header
from app.core.supabase import supabase
from app.core.auth import get_user_id
from app.schemas.visit import VisitCreate, VisitUpdate, VisitResponse

router = APIRouter()


def check_customer_owner(customer_id: str, user_id: str):
    """customer_id が自分の顧客かチェックする"""
    res = (
        supabase.table("customers")
        .select("id")
        .eq("id", customer_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="顧客が見つかりません")


@router.get("/customers/{customer_id}/visits")
def list_visits(customer_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    check_customer_owner(customer_id, user_id)

    res = (
        supabase.table("visits")
        .select("*")
        .eq("customer_id", customer_id)
        .eq("user_id", user_id)   # 自分のデータのみ返す
        .order("visited_at", desc=True)
        .execute()
    )
    return res.data


@router.post("/customers/{customer_id}/visits", response_model=VisitResponse)
def create_visit(customer_id: str, body: VisitCreate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    check_customer_owner(customer_id, user_id)

    data = body.model_dump(mode="json")   # datetime を ISO 文字列に変換
    data["customer_id"] = customer_id
    data["user_id"] = user_id
    res = supabase.table("visits").insert(data).execute()
    return res.data[0]


@router.get("/visits/{visit_id}", response_model=VisitResponse)
def get_visit(visit_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    res = (
        supabase.table("visits")
        .select("*")
        .eq("id", visit_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="来店記録が見つかりません")
    return res.data[0]


@router.put("/visits/{visit_id}", response_model=VisitResponse)
def update_visit(visit_id: str, body: VisitUpdate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    existing = (
        supabase.table("visits")
        .select("id")
        .eq("id", visit_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="来店記録が見つかりません")

    data = {k: v for k, v in body.model_dump(mode="json").items() if v is not None}
    res = (
        supabase.table("visits")
        .update(data)
        .eq("id", visit_id)
        .eq("user_id", user_id)   # UPDATE にも必ず user_id フィルタを付ける
        .execute()
    )
    return res.data[0]


@router.delete("/visits/{visit_id}")
def delete_visit(visit_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    existing = (
        supabase.table("visits")
        .select("id")
        .eq("id", visit_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="来店記録が見つかりません")

    supabase.table("visits").delete().eq("id", visit_id).eq("user_id", user_id).execute()
    return {"message": "削除しました"}
```

---

#### Step 3: `app/main.py` にルーターを登録する

```python
from app.routers import visits

app.include_router(visits.router, tags=["visits"])
```

---

#### 動作確認

1. `POST /auth/login` でトークンを取得して「Authorize」に設定
2. MTKに顧客を1件作成してもらい、その `customer_id` を受け取る
3. `POST /customers/{customer_id}/visits` で来店を登録
4. `GET /customers/{customer_id}/visits` で一覧が返ってくることを確認

---

## Phase 4: 収入管理API実装

### このフェーズでやること

日ごとの収入を記録するAPIを実装します。
来店管理API（Phase 3）と同じパターンで実装できます。

ブランチ: `feature/income-api`

### 実装するエンドポイント

| メソッド | URL             | 内容     |
| -------- | --------------- | -------- |
| GET      | `/incomes`      | 収入一覧 |
| POST     | `/incomes`      | 収入記録 |
| GET      | `/incomes/{id}` | 収入詳細 |
| PUT      | `/incomes/{id}` | 収入更新 |
| DELETE   | `/incomes/{id}` | 収入削除 |

### クエリパラメータ（一覧）

| パラメータ   | 型   | 説明                 |
| ------------ | ---- | -------------------- |
| `from_date`  | date | 開始日（YYYY-MM-DD） |
| `to_date`    | date | 終了日（YYYY-MM-DD） |

> `from` はPythonの予約語のため、パラメータ名は `from_date` / `to_date` を使います。

### 作成するファイル

```
backend/app/
├── schemas/
│   └── income.py       # 収入のリクエスト・レスポンスの型定義
└── routers/
    └── incomes.py      # 収入管理エンドポイントの実装
```

### ステップ別実装ガイド

#### Step 1: `app/schemas/income.py` を作成する

```python
from pydantic import BaseModel, Field
from datetime import date
from typing import Optional
import uuid


class IncomeCreate(BaseModel):
    income_date: date          # フィールド名に "income_" を付けて date 型名との衝突を避ける
    amount: int = Field(ge=0)  # ge=0 はゼロ以上のみ受け付ける
    note: Optional[str] = None


class IncomeUpdate(BaseModel):
    income_date: Optional[date] = None
    amount: Optional[int] = Field(default=None, ge=0)
    note: Optional[str] = None


class IncomeResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    income_date: date
    amount: int
    note: Optional[str] = None
```

> **フィールド名について:** `date` という名前のフィールドを作ると、同じクラス内で `date` 型を型ヒントとして使えなくなります（Python の名前の衝突）。そのため `income_date` という名前を使っています。DBのカラム名（`date`）と異なりますが、後述の `model_dump` の際に対応します。

---

#### Step 2: `app/routers/incomes.py` を作成する

Phase 3 の `visits.py` と同じパターンです。`customer_id` のチェックがない分シンプルになります。

```python
from fastapi import APIRouter, HTTPException, Header
from datetime import date
from typing import Optional
from app.core.supabase import supabase
from app.core.auth import get_user_id
from app.schemas.income import IncomeCreate, IncomeUpdate, IncomeResponse

router = APIRouter()


@router.get("/incomes")
def list_incomes(
    authorization: str = Header(...),
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
):
    user_id = get_user_id(authorization)
    query = supabase.table("incomes").select("*").eq("user_id", user_id)

    if from_date:
        query = query.gte("date", str(from_date))
    if to_date:
        query = query.lte("date", str(to_date))

    return query.order("date", desc=True).execute().data


@router.post("/incomes", response_model=IncomeResponse)
def create_income(body: IncomeCreate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    data = body.model_dump(mode="json")
    # スキーマのフィールド名 income_date をDBのカラム名 date に変換する
    data["date"] = data.pop("income_date")
    data["user_id"] = user_id
    res = supabase.table("incomes").insert(data).execute()
    return res.data[0]


@router.get("/incomes/{income_id}", response_model=IncomeResponse)
def get_income(income_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    res = (
        supabase.table("incomes")
        .select("*")
        .eq("id", income_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="収入記録が見つかりません")
    return res.data[0]


@router.put("/incomes/{income_id}", response_model=IncomeResponse)
def update_income(income_id: str, body: IncomeUpdate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    existing = (
        supabase.table("incomes")
        .select("id")
        .eq("id", income_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="収入記録が見つかりません")

    data = {k: v for k, v in body.model_dump(mode="json").items() if v is not None}
    if "income_date" in data:
        data["date"] = data.pop("income_date")
    res = (
        supabase.table("incomes")
        .update(data)
        .eq("id", income_id)
        .eq("user_id", user_id)   # UPDATE にも必ず user_id フィルタを付ける
        .execute()
    )
    return res.data[0]


@router.delete("/incomes/{income_id}")
def delete_income(income_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    existing = (
        supabase.table("incomes")
        .select("id")
        .eq("id", income_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="収入記録が見つかりません")

    supabase.table("incomes").delete().eq("id", income_id).eq("user_id", user_id).execute()
    return {"message": "削除しました"}
```

---

#### Step 3: `app/main.py` にルーターを登録する

```python
from app.routers import incomes

app.include_router(incomes.router, tags=["incomes"])
```

---

#### 動作確認

1. `POST /auth/login` でトークンを取得して「Authorize」に設定
2. `POST /incomes` で収入を1件記録
3. `GET /incomes` で一覧が返ってくることを確認
4. `GET /incomes?from_date=2026-04-01&to_date=2026-04-30` で日付絞り込みが動くことを確認

---

---

## 共有事項

- APIの仕様変更が必要な場合は**必ず事前にフロントエンド担当に相談**してください
- 不明点はお互いに気軽に相談してください
