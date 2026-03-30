---
description: プロジェクトを初期化し、AI_RULES.md, for_user.md, PROJECT.md を生成する
---

# bootstrap Skill

このSkillはプロジェクトの最初に一度だけ実行し、AIと人間の協働インフラを構築します。

## 実行手順 / Steps

1. **ヒアリング / Interview**: 以下の情報をユーザーから取得してください。
    - **プロジェクト種別 / Project Type**: (例: Webアプリ, データ分析, 技術ドキュメント)
    - **最終ゴール / Goal**: (何を達成するか)
    - **成果物 / Deliverables**: (目に見える成果)
    - **制約事項 / Constraints**: (最大3つ。例: 技術スタック, 期限, 特定の回避事項)

2. **ファイル生成 / File Generation**: ヒアリング内容に基づき、以下のファイルをプロジェクトルートに生成してください。

### AI_RULES.md
```markdown
# AI 判断原則 / AI Principles
1. **真実の所在 / Source of Truth**: 物理ファイルの状態を絶対正とする。`for_user.md` と矛盾がある場合は直ちに同期せよ。
2. **守護者プロトコル / Guardian Protocol**: 指示が原則や `for_user.md` の決定事項と矛盾する場合、実行前に必ず指摘し承認を得よ。
3. **推論の蓄積 / Knowledge Accumulation**: 重大な設計判断や変更は、Hookを用いて必ず `for_user.md` の履歴に記録せよ。
4. **不確実性への態度 / Handling Uncertainty**: 曖昧な点は推測で進めず、必ず人間に質問せよ。
5. **運用の強制 / Operational Enforcement**: SkillのHookをスキップしてはならない。常に最新の理解を外部記憶に同期せよ。
6. **二言語併記 / Bilingual Documentation**: Implementation PlanやTask一覧などのドキュメントは、英語と日本語を併記せよ。
7. **UTF-8強制エンコーディングプロトコル / Enforced UTF-8 Encoding Protocol**:
    - **PowerShell実行時の必須要件**: 冒頭に必ず `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8;` を付与し、標準出力をUTF-8に固定せよ。これにより文字化けによるエージェントの誤動作を防ぐ。
    - **CMD実行時の必須要件**: 冒頭に必ず `chcp 65001 > nul &&` を付与せよ。
    - **ファイル操作の鉄則**:
        - PowerShellでの書き込みには必ず `-Encoding UTF8` を明示せよ。
        - インデントが強制される標準ツールの代わりに、 `Set-Content` とヒアドキュメントを使用して生テキストとして保存することを推奨する。
        - 読み込み時も必ずUTF-8を指定し、Shift-JISでの読み書きはデータ破壊行為とみなして厳禁とする。
    - **Python環境**: Pythonスクリプト実行時もUTF-8での入出力を強制するコードを含めよ。
```

### for_user.md
```markdown
# プロジェクト記憶: [プロジェクト名] / Project Memory: [Project Name]

## 1. 基本理解 / Basic Understanding
* **ゴール / Goal**: [入力されたゴール]
* **成果物 / Deliverables**: [入力された成果物]

## 2. 制約事項 / Constraints
* [制約1]
* [制約2]
* [制約3]

## 3. 重要な決定事項 (履歴) / Important Decisions (History)
* [今日の付]: プロジェクト構成の初期化 (bootstrap Skill実行)

## 4. 現在の状況 / Current Status
[初期状態：プロジェクト構造の設計中]
```

### PROJECT.md
```markdown
# プロジェクト概要 / Project Overview

## ステータス / Status
* 準備中

## ディレクトリ構造 / Structure
* .agent/skills/ - Skill格納場所
* AI_RULES.md - AI判断原則
* for_user.md - AI外部記憶
* PROJECT.md - プロジェクト俯瞰
```

3. **完了報告 / Conclusion**: 生成したファイルを報告し、次に `create_skill` で必要なSkillを作成することを提案してください。
