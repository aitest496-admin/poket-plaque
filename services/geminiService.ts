import { GoogleGenAI } from "@google/genai";
import { ToothData } from "../types";

// Initialize Gemini Client inside the function to get the latest key from localStorage
export const analyzeDentalChart = async (teeth: ToothData[]): Promise<string> => {
  const apiKey = localStorage.getItem('GEMINI_API_KEY');
  
  if (!apiKey) {
    return "APIキーが設定されていません。右上の設定アイコン（歯車）からGemini APIキーを入力してください。";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const model = "gemini-2.5-flash";

    // Filter to only teeth that have some data
    const activeTeeth = teeth.filter(t =>
      t.mobility > 0 ||
      Object.values(t.plaque).some(Boolean) ||
      t.bleeding.buccal.some(Boolean) || t.bleeding.lingual.some(Boolean) ||
      t.pus.buccal.some(Boolean) || t.pus.lingual.some(Boolean) ||
      t.pocketDepth.buccal.some(d => d !== null && d > 3) ||
      t.pocketDepth.lingual.some(d => d !== null && d > 3)
    );

    if (activeTeeth.length === 0) {
      return "チャートに特筆すべき所見は記録されていません。";
    }

    const prompt = `
    あなたは優秀な歯周病専門医です。患者の6点法歯周組織検査チャートを表す以下の生のJSONデータを分析してください。
    
    データ構造凡例:
    - id: 歯番号 (1-8)
    - mobility: 動揺度 (0-3の尺度)
    - plaque: プラーク (5面におけるboolean)
    - bleeding (BOP): 出血 { buccal: [遠心, 中央, 近心], lingual: [遠心, 中央, 近心] }
    - pus: 排膿 { buccal: [遠心, 中央, 近心], lingual: [遠心, 中央, 近心] }
    - pocketDepth: ポケット深さ { buccal: [遠心, 中央, 近心], lingual: [遠心, 中央, 近心] } (単位: mm)

    患者データ (所見のある部位のみ):
    ${JSON.stringify(activeTeeth, null, 2)}

    タスク:
    カルテや紹介状に適した、簡潔な日本語の臨床サマリーを提供してください。
    1. 病変の広がり（全顎的 vs 局所的）を要約する。
    2. 最も深いポケットのある部位を特定して記載する（例：右上3番 遠心頬側 8mm）。
    3. 出血・排膿がみられる歯を特定する。
    4. 歯周炎の重症度を分類する。
    5. 次の治療ステップ（TBI、スケーリング、ルートプレーニング、外科処置の検討など）を提案する。

    フォーマット: Markdownを使用してください。プロフェッショナルで簡潔な、標準的な歯科医療用語を使用してください。回答はすべて日本語で記述してください。
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "分析結果を生成できませんでした。";

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return "AIサービスへの接続エラーが発生しました。API設定を確認してください。";
  }
};