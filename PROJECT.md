# プロジェクト概要 / Project Overview: yutai-manager

## ステータス / Status
* 開発中 / In Development

## プロジェクト種別 / Project Type
* Next.js Webアプリケーション (株主優待管理)

## ディレクトリ構造 / Directory Structure
```
yutai-manager/
├── .agent/
│   └── skills/          # プロジェクト固有のSkills（今後追加）
├── src/
│   ├── app/            # Next.js App Router
│   ├── components/     # Reactコンポーネント
│   ├── data/           # 静的データ
│   ├── hooks/          # カスタムフック
│   ├── lib/            # ユーティリティ・設定
│   └── types/          # TypeScript型定義
├── public/             # 静的アセット
├── AI_RULES.md         # AI判断原則
├── for_user.md         # AI外部記憶
└── PROJECT.md          # プロジェクト俯瞰（このファイル）
```

## 技術スタック / Tech Stack
* **フレームワーク**: Next.js 16.1.4 (App Router)
* **言語**: TypeScript 5
* **UI**: React 19, TailwindCSS 4, lucide-react
* **データベース**: Supabase
* **AI**: Google AI SDK (Gemini), Vercel AI SDK
* **バリデーション**: Zod

## 開発コマンド / Development Commands
* `npm run dev`: 開発サーバー起動 (0.0.0.0:3000)
* `npm run build`: プロダクションビルド
* `npm run lint`: ESLint実行
