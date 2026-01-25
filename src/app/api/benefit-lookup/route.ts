import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

// Response schema for AI-generated benefit info
const BenefitSchema = z.object({
    stockCode: z.string().describe("証券コード"),
    stockName: z.string().describe("銘柄名"),
    benefits: z.array(
        z.object({
            minShares: z.number().describe("最低必要株数"),
            vestingMonths: z.array(z.number()).describe("権利確定月 (1-12)"),
            arrivalMonths: z.array(z.number()).describe("届く月の目安 (1-12)"),
            description: z.string().describe("優待内容の説明"),
            category: z
                .enum(["food", "discount", "gift", "qou_card", "travel", "other"])
                .describe("優待カテゴリ"),
            longTermTiers: z.array(z.object({
                minYears: z.number().describe("最低保有年数"),
                minShares: z.number().describe("最低保有株数"),
                description: z.string().describe("優待内容"),
                upgradeDescription: z.string().optional().describe("差分説明"),
            })).optional().describe("長期保有優待"),
        })
    ),
    confidence: z.enum(["high", "medium", "low"]).describe("情報の信頼度"),
    source: z.string().describe("情報源の説明"),
});

export async function POST(request: NextRequest) {
    try {
        const { stockCode, stockName } = await request.json();

        if (!stockCode && !stockName) {
            return NextResponse.json(
                { error: "銘柄コードまたは銘柄名が必要です" },
                { status: 400 }
            );
        }

        // Check if API key is configured
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            return NextResponse.json(
                { error: "AI APIキーが設定されていません。環境変数 GOOGLE_GENERATIVE_AI_API_KEY を設定してください。" },
                { status: 500 }
            );
        }

        const query = stockCode || stockName;

        const { object } = await generateObject({
            model: google("gemini-2.0-flash"),
            schema: BenefitSchema,
            prompt: `あなたは日本の株主優待情報の専門家です。
以下の銘柄の株主優待情報を調べて、正確な情報を返してください。

銘柄: ${query}

注意事項:
- 権利確定月は実際のものを返してください (例: 3月と9月なら [3, 9])
- 届く月は権利確定日から約2-3ヶ月後が一般的です
- 優待内容は具体的に記述してください (金額、枚数など)
- 長期保有優待（1年以上、3年以上など）がある場合は必ず longTermTiers に含めてください
- confidence は情報の確からしさを示してください
  - high: 上場している有名企業で優待情報が明確
  - medium: 情報はあるが不確かな部分がある
  - low: 推測を含む、または最近変更があった可能性
- source には「2024年時点の一般的な公開情報に基づく」などと記載

もし優待がない銘柄の場合は、benefits を空の配列にして、confidence を "high" にしてください。`,
        });

        return NextResponse.json(object);
    } catch (error) {
        console.error("AI lookup error:", error);

        // Check for rate limit errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
            return NextResponse.json(
                { error: "APIリクエスト制限に達しました。1分後に再度お試しください。" },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: "AI情報取得に失敗しました: " + errorMessage },
            { status: 500 }
        );
    }
}
