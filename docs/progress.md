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

## 画面一覧（暫定）

```
認証
├── ログイン画面
└── 新規登録画面

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
| UIライブラリ | 未定（shadcn/ui + Tailwind CSS 推奨） | デザインAIへ依頼予定 |
| バックエンド | Python + FastAPI | Swagger UI自動生成あり |
| データベース | PostgreSQL（Supabase） | |
| 認証 | Supabase Auth | メール/パスワード → Google/LINE OAuth 追加予定 |
| FEデプロイ | Vercel | 無料枠 |
| BEデプロイ | Render | 無料枠 〜 $7/月 |
| コスト目安 | ¥0〜¥5,000/月 | スケールに応じて |

---

## リポジトリ構成

```
therapist-app/
├── frontend/               # React + TypeScript + Vite PWA
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
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

## Git・インフラ設定

- **リポジトリ**: https://github.com/Milinn-code/therapist-app
- **ブランチ戦略**: GitHub Flow（`main` + `feature/*`）
- **認証方式**: Personal Access Token（HTTPS）

---

## 作業ログ

| 日付 | 内容 |
|---|---|
| 2026-02-27 | プロジェクト方針・技術スタック決定 |
| 2026-02-27 | GitHubリポジトリとローカルを接続 |
| 2026-02-27 | モノレポ初期構成を作成・プッシュ |

---

## 次のステップ

- [ ] UIライブラリの選定（shadcn/ui + Tailwind CSS 推奨）
- [ ] Viteプロジェクトの初期化
- [ ] ルーティング設定（React Router）
- [ ] 各画面のデザイン作成（他AIへ依頼）
- [ ] Supabaseプロジェクト作成・DB設計
- [ ] OpenAPI仕様書の詳細定義（FE/BE合意）
- [ ] FastAPI認証実装
