# Vercelデプロイ手順書 / Vercel Deployment Guide

このプロジェクト (`yutai-manager`) を Vercel にデプロイし、外出先からスマートフォンでアクセスするための手順です。

## 1. 準備

### GitHub へのコード保存
Vercel と連携するために、まずは GitHub にリポジトリを作成してコードを push してください。

```bash
git add .
git commit -m "Initial commit for Vercel deployment"
git push origin main
```

## 2. Vercel でのプロジェクト作成

1. [Vercel](https://vercel.com/) にログインし、**[Add New...] > [Project]** を選択します。
2. 先ほど push した GitHub リポジトリを選択（Import）します。

## 3. 環境変数の設定 (重要)

デプロイ設定画面の **"Environment Variables"** セクションで、以下の値を設定してください。
これを行わないと、データベース接続や AI 機能が動作しません。

| キー | 値の取得元 |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト設定からコピー |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase プロジェクト設定からコピー |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI Studio から取得した API キー |

> [!IMPORTANT]
> ローカルの `.env.local` ファイルに記載されている値をそのままコピーして設定してください。

## 4. デプロイの実行

1. **[Deploy]** ボタンをクリックします。
2. 数分待つとデプロイが完了し、`https://yutai-manager-xxx.vercel.app` のような URL が発行されます。

## 5. 外出先からのアクセス

1. 発行された URL をスマートフォンのブラウザに入力します。
2. これで、Wi-Fi 環境に関わらず外出先からアクセス可能になります。

---

## 注意事項
*   **無料枠:** Vercel や Supabase の無料枠の範囲内で十分に動作します。
*   **データの同期:** 外出先でスマホから追加したデータと、家で PC から追加したデータは、同じ Supabase データベースを参照するため自動的に同期されます。
