# 開発ツール・ワークフロー メモ

最終更新: 2026-03-04

---

## 使用ツール一覧

| ツール | 用途 |
|---|---|
| Claude Code CLI | ローカルプロジェクトのファイル編集・コード生成 |
| Claude Desktop | UIプロトタイプのプレビュー・アイデア出し |
| v0.dev | デザインコンポーネント生成・GitHub PR連携 |
| Vite dev server | 実際の動作確認（localhost:5173） |

---

## Claude Code CLI vs Claude Desktop

### Claude Code CLI（ターミナル）

- 実際のプロジェクトファイルを直接編集できる
- git操作・テスト実行・依存パッケージ管理が得意
- プレビュー機能はない → ブラウザで手動確認

```bash
# 起動例
npm run dev
# → ブラウザで localhost:5173 を開いて確認
```

### Claude Desktop（デスクトップアプリ）

- インストール先: https://claude.ai/downloads
- **Artifacts機能**: コードを生成すると右側にプレビューが表示される
- HTML・Reactコンポーネントをその場で確認しながら修正できる
- ローカルのプロジェクトファイルとは直接連携しない

---

## 推奨ワークフロー

### UIコンポーネントを新規作成するとき

```
1. Claude Desktop でプロトタイプ作成
   → Artifactsでプレビューを見ながら修正

2. 完成したコードをコピー

3. Claude Code CLI でプロジェクトに貼り付け・統合
   → npm run dev で実際の動作確認
```

### 既存ファイルのバグ修正・機能追加

```
1. Claude Code CLI で直接ファイルを編集

2. ブラウザ（localhost:5173）で確認
```

---

## Claude Desktop のインストール

1. https://claude.ai/downloads からWindows版をダウンロード
2. インストーラーを実行
3. スタートメニューから「Claude」を起動
4. claude.ai と同じアカウントでログイン

---

## メモ

- Claude Desktop の `+` ボタン → ファイル添付・プロジェクト作成・ウェブ検索・コネクタ追加（Canva, Slack等）が可能
- MCP（Model Context Protocol）を設定すれば Claude Desktop からローカルファイルへのアクセスも可能（設定は複雑）
