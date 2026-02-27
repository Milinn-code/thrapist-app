# Melty 開発進捗メモ

最終更新: 2026-02-27

---

## プロジェクト概要

| 項目 | 内容 |
|---|---|
| アプリ名 | Melty |
| 種別 | PWA（野良アプリ） |
| ターゲット | 水商売従事者（ホステスなど） |
| コンセプト | 元ホステスが開発した水商売専用の顧客管理アプリ |

---

## 機能一覧

### 顧客管理・営業
1. 顧客プロフィール（好きなお酒・趣味・誕生日・会社情報など）
2. 顧客一覧（並び替え・絞り込み・グループ分け）
3. カテゴライズ機能（グループ / ランク A〜D）
4. 来店管理（会話メモ・売上・写真）
5. LINE一斉送信（※PWAでの完全自動送信は困難。仕様検討中）

### スケジュール・成績
6. 来店スケジュール管理（カレンダー表示・色分け）
7. スケジュール・シフト管理
8. 収入管理（売上・手当・バック）
9. 誕生日一覧表示
10. 売上・成績グラフ（締日設定可）

### 安全
11. パスコードロック
12. クラウド保存・バックアップ・マルチデバイス対応

---

## 画面一覧

```
認証
├── ログイン画面          ✅ 完了
└── 新規登録画面          ✅ 完了

顧客管理
├── 顧客一覧画面
├── 顧客詳細・プロフィール画面
├── 顧客追加・編集画面
└── 来店登録画面

カレンダー
├── カレンダー画面（来店・シフト）
└── スケジュール管理画面

収入・成績
├── 収入記録画面
└── グラフ・ランキング画面

設定
├── パスコードロック設定
└── 締日設定画面
```

---

## チーム構成

| 役割 | 人数 | 担当 |
|---|---|---|
| フロントエンド | 1名 | React + TypeScript + Vite PWA |
| バックエンド | 2名 | Python + FastAPI |

---

## 技術スタック

| 領域 | 技術 | 備考 |
|---|---|---|
| フロントエンド | React + TypeScript + Vite | PWA化: Vite PWA Plugin |
| UIライブラリ | Tailwind CSS v4 + shadcn/ui | New Yorkスタイル |
| デザインツール | v0.dev | GitHubリポジトリ連携済み |
| バックエンド | Python + FastAPI | Swagger UI自動生成あり |
| データベース | PostgreSQL（Supabase） | |
| 認証 | Supabase Auth | メール/パスワード → Google/LINE OAuth 追加予定 |
| FEデプロイ | Vercel | 無料枠 |
| BEデプロイ | Render | 無料枠 〜 $7/月 |
| コスト目安 | ¥0〜¥5,000/月 | スケールに応じて |

---

## デザイン方針

| 項目 | 内容 |
|---|---|
| テーマ | ライト系（白・ピンク・ローズ） |
| メインカラー | ピンク（oklch 0.65 0.2 350） |
| レイアウト | モバイルファースト・375px幅基準 |
| コンポーネント | shadcn/ui（Card・Button・Input・Label） |
| アイコン | lucide-react |

---

## リポジトリ構成

```
therapist-app/
├── frontend/               # React + TypeScript + Vite PWA
│   ├── public/
│   └── src/
│       ├── components/
│       │   └── ui/         # shadcn/uiコンポーネント
│       ├── pages/
│       │   ├── auth/       # ログイン・新規登録 ✅
│       │   ├── customers/  # 顧客管理
│       │   ├── calendar/   # カレンダー
│       │   ├── income/     # 収入・成績
│       │   └── settings/   # 設定
│       ├── hooks/
│       └── lib/
├── backend/                # Python + FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── core/
│   ├── requirements.txt
│   └── .env.example
├── docs/
│   ├── openapi.yaml        # API仕様書（スケルトン）
│   └── progress.md         # 本ファイル
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## URL構成

| URL | 画面 | 状態 |
|---|---|---|
| `/login` | ログイン | ✅ 完了 |
| `/register` | 新規登録 | ✅ 完了 |
| `/customers` | 顧客一覧 | 未着手 |
| `/customers/new` | 顧客追加 | 未着手 |
| `/customers/:id` | 顧客詳細 | 未着手 |
| `/customers/:id/edit` | 顧客編集 | 未着手 |
| `/customers/:id/visits/new` | 来店登録 | 未着手 |
| `/calendar` | カレンダー | 未着手 |
| `/income` | 収入・成績 | 未着手 |
| `/settings` | 設定 | 未着手 |

---

## Git・インフラ設定

- **リポジトリ**: https://github.com/Milinn-code/therapist-app
- **ブランチ戦略**: GitHub Flow（`main` + `feature/*`・v0.devブランチ）
- **認証方式**: Personal Access Token（HTTPS）
- **v0.dev連携**: GitHubリポジトリ接続済み・PRフローで運用

---

## 作業ログ

| 日付 | 内容 |
|---|---|
| 2026-02-27 | プロジェクト方針・技術スタック決定 |
| 2026-02-27 | GitHubリポジトリとローカルを接続 |
| 2026-02-27 | モノレポ初期構成を作成・プッシュ |
| 2026-02-27 | Viteプロジェクト初期化・PWA設定 |
| 2026-02-27 | Tailwind CSS v4 + shadcn/ui導入 |
| 2026-02-27 | React Routerでルーティング設定 |
| 2026-02-27 | v0.devでログイン・新規登録画面をデザイン・PRマージ |

---

## 次のステップ

- [x] UIライブラリの選定（shadcn/ui + Tailwind CSS）
- [x] Viteプロジェクトの初期化
- [x] ルーティング設定（React Router）
- [x] ログイン・新規登録画面のデザイン（v0.dev）
- [ ] 共通レイアウト（下部ナビゲーションバー）
- [ ] 顧客一覧画面
- [ ] 顧客詳細・編集・来店登録画面
- [ ] カレンダー画面
- [ ] 収入・成績画面
- [ ] 設定画面
- [ ] Supabaseプロジェクト作成・DB設計
- [ ] OpenAPI仕様書の詳細定義（FE/BE合意）
- [ ] FastAPI認証実装
