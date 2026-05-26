# システム把握メモ

## システム概要

Smart Perio Chartは、歯周病検査の入力・保存・比較・印刷プレビューを行うReact/Vite製のフロントエンドPOCです。

主な対象業務:

- 歯周ポケット深さの入力
- BOP、排膿、動揺度、プラークの入力
- 1点法、4点法、6点法の切替
- 欠損歯、乳歯の設定
- 検査日ごとの保存と読み込み
- 過去データ比較
- PISA自動計算
- 印刷プレビュー

## 主要ファイル

| ファイル | 役割 |
|---|---|
| `App.tsx` | 画面全体、状態管理、保存・読込、モード切替 |
| `types.ts` | 歯、プラーク、測定値、測定法の型定義 |
| `services/db.ts` | IndexedDB保存・読込・削除 |
| `utils/pisaCalculator.ts` | PISA/PESA/BOP率の計算 |
| `components/Tooth.tsx` | 歯ごとの入力UI |
| `components/PocketDepthChart.tsx` | ポケット深さ入力 |
| `components/ThreePointToggle.tsx` | BOP/排膿の3点トグル |
| `components/PlaqueDiagram.tsx` | プラーク面入力 |
| `components/SixPointPrintView.tsx` | 印刷用チャート |
| `components/PisaPreview.tsx` | PISAプレビュー |
| `components/CalendarModal.tsx` | 日付選択 |
| `components/ExaminerModal.tsx` | 担当者選択 |

## データ構造の要点

- 1歯は `ToothData` として管理される。
- 各歯は `id`, `mobility`, `plaque`, `pus`, `bleeding`, `pocketDepth`, `isMissing`, `isPrimary` を持つ。
- ポケット、BOP、排膿は頬側3点・舌側3点の計6点構造。
- 測定法は `1-point`, `4-point`, `6-point`。
- 保存は日付をキーにIndexedDBへ保存される。

## 検証で特に注意する箇所

- 測定法を切り替えた時に、入力済みデータが意図せず消えないか。
- 1点法、4点法、6点法で表示点と保存データの対応が正しいか。
- 上顎・下顎、右側・左側で、入力方向や歯番号の表示が臨床感覚と合っているか。
- 欠損歯にした時、入力値、PISA、印刷表示、比較表示が一貫しているか。
- 保存済み日付を読み込んだ時、担当者、開始時刻、終了時刻、測定法、検査データが復元されるか。
- PISA計算が欠損歯、BOPなし、PPD未入力、第三大臼歯を含むケースで破綻しないか。

