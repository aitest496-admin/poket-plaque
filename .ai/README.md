# AI検証ワークスペース

このフォルダは、Smart Perio Chartを繰り返し検証し、antigravityへ修正指示を出すための作業場所です。

## 重要ルール

- 既存のアプリ本体ファイルは、検証中に直接変更しない。
- 検証メモ、バグ記録、修正指示案はこの `.ai` フォルダ内にだけ追加・更新する。
- 修正はantigravityへ依頼し、修正後に同じ観点で再検証する。
- ひとつの問題につき、再現手順、期待結果、実際結果、影響度を必ず残す。

## ファイル構成

- `00_verification_workflow.md`: 検証の進め方と反復サイクル
- `01_system_understanding.md`: 現在のシステム把握メモ
- `02_test_checklist.md`: 機能別の検証チェックリスト
- `03_bug_report_template.md`: バグ報告テンプレート
- `04_antigravity_fix_prompt_template.md`: antigravityへの修正指示テンプレート
- `05_findings_log.md`: 検証で見つけた問題の記録
- `06_regression_test.md`: 修正後の再検証項目
- `07_efficiency_review.md`: 入力効率・操作性の検証観点
- `08_codex_verification_prompt.md`: Codexへ検証だけを依頼するための指示文
- `20_development_handoff_index.md`: 本開発引き継ぎ資料の目次
- `21_requirement_definition_for_development.md`: 本開発向け要件定義書
- `22_screen_and_workflow_spec.md`: 画面・操作フロー仕様
- `23_data_and_business_rules.md`: データ・業務ルール仕様
- `24_open_questions_for_development.md`: 本開発前の未決事項・確認リスト

## 推奨する使い方

1. `00_verification_workflow.md` に沿って、検証対象を決める。
2. `02_test_checklist.md` を見ながら実操作する。
3. 問題があれば `05_findings_log.md` に記録する。
4. 重要な問題は `03_bug_report_template.md` で詳細化する。
5. antigravityへ依頼する時は `04_antigravity_fix_prompt_template.md` を使う。
6. 修正後は `06_regression_test.md` で再発確認を行う。

## Codexに検証を依頼する時

Codexへ依頼する場合は、必ず `08_codex_verification_prompt.md` の文面を使う。

特に重要:

- Codexはシステム本体を絶対に修正しない。
- Codexが編集してよいのは `.ai` フォルダ内のMarkdownだけ。
- バグや改善点を見つけたら、antigravityへ渡せる修正指示として整理する。
