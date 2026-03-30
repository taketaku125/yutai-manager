---
description: 新しいSkillを生成し、自動的にHookを注入する
---

# create_skill Skill

このSkillは、新しい機能（Skill）を追加する際に使用します。
常に「Guardian Hook」を末尾に注入することで、AIの理解が `for_user.md` に自動同期されることを保証します。

## 実行手順 / Steps

1. **要件定義 / Requirements**: ユーザーから作りたいSkillの機能と名前をヒアリングしてください。

2. **Skill生成 / Skill Generation**: `.agent/skills/[name].md` を作成します。
    - **System注入 / System Injection**: Skillの冒頭で `AI_RULES.md` の原則に従うことを明記してください。
    - **Hookの強制注入 / Mandatory Hook Injection**: Skillの末尾に必ず以下の「Guardian Hook」セクションを含めてください。

### 注入するHookの例 / Hook Example
```markdown
## Hook: 理解の同期 / Sync Understanding
このSkillの実行後、以下の処理を**必ず**実行せよ：
1. **差分の抽出**: 作業を通じて得られた新しい知見、設計判断、または `for_user.md` との矛盾を特定せよ。
2. **外部記憶の更新**: `for_user.md` を最新の状態に更新せよ。重大な判断は「重要な決定事項（履歴）」セクションに追記すること。
3. **整合性確認**: 物理ファイル、`AI_RULES.md`、`for_user.md` の3者が矛盾していないことを最終確認せよ。
```

3. **登録 / Registration**: `PROJECT.md` のディレクトリ構造やSkill一覧を更新してください。
