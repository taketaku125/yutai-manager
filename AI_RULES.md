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
