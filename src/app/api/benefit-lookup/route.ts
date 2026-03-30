import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

        // 1. Session check (Restrict to authenticated users)
        const authHeader = request.headers.get("Authorization");
        let user = null;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
            if (!authError && authUser) {
                user = authUser;
            }
        }

        if (!user) {
            return NextResponse.json(
                { error: "AI検索を利用するにはログインが必要です" },
                { status: 401 }
            );
        }

        const query = (stockCode || stockName).trim();

        // 2. Cache Check
        if (stockCode) {
            const { data: cached } = await supabase
                .from('benefit_cache')
                .select('data')
                .eq('stock_code', stockCode)
                .single();

            if (cached) {
                return NextResponse.json(cached.data);
            }
        }

        const { object } = await generateObject({
            model: google("gemini-2.0-flash"),
            schema: BenefitSchema,
            prompt: `あなたは日本の株主優待制度、および全上場企業の4桁の証券コードを熟知した専門家です。
以下の指示に従い、指定された銘柄の正確な情報を抽出してください。

銘柄検索クエリ: "${query}"

【最重要命令：思考プロセスとハルシネーションの排除】
1. **ステップバイステップの検証**: 
   - まずクエリ（${query}）から「現在の正式な会社名」を特定してください。
   - 次に、そのコードと会社名が**日本取引所グループ（JPX）のデータと一致するか**を脳内で厳密に確認してください。
   - **絶対に間違えてはいけない例**:
     - 「7698」は「アイスコ」です。ツルハ（3391）ではありません。
     - 「9218」は「メンタルヘルステクノロジーズ」です。「Ｍ－アクセル」などの存在しない、または無関係な名称は**絶対に**出さないでください。
2. **謎言語・文字化けの禁止**:
   - 「Ｍ－アクセル」「」のような、明らかに日本語として不自然な、あるいは意味不明な文字列を出力しないでください。
   - 情報が不明な場合は、当てずっぽうで埋めず、benefitsを [] （空配列）にし、confidenceを "low" または "medium" にしてください。
3. **優待の有無の再確認**:
   - 9218（メンタルヘルステクノロジーズ）のように、優待制度そのものがない銘柄も多く存在します。その場合は benefits を空にしてください。

【出力詳細】
- **stockName**: 特定した正式な会社名のみ。
- **benefits**: 
    - 具体的かつ日本語として自然な文章で記述してください。
    - カテゴリを適切に選択。
    - 長期保有特典がある場合は詳細に記述。
- **confidence**: 
    - 代码と会社名が完全に一致し、優待内容も最新だと断言できる場合のみ "high"。
    - 少しでも記憶が曖昧、またはノイズが混ざりそうな場合は "medium" 以下。
- **source**: 「2024年のIR情報に基づく」「公式発表データより」など根拠を記載。`,
        });

        // 3. Save to Cache
        if (stockCode && object) {
            await supabase
                .from('benefit_cache')
                .upsert({
                    stock_code: stockCode,
                    stock_name: object.stockName,
                    data: object,
                    updated_at: new Date().toISOString()
                });
        }

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
