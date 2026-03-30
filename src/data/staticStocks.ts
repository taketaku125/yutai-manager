import { Stock, BenefitRule } from "@/types";

/**
 * 銘柄マスターデータ
 * 証券コードをキーとしたオブジェクト形式にすることでDB的な検索を高速化
 */
export const STOCK_MASTER: Record<string, Stock> = {
    "2702": { code: "2702", name: "日本マクドナルドホールディングス" },
    "9202": { code: "9202", name: "ANAホールディングス" },
    "9201": { code: "9201", name: "日本航空" },
    "8267": { code: "8267", name: "イオン" },
    "9861": { code: "9861", name: "吉野家ホールディングス" },
    "3197": { code: "3197", name: "すかいらーくホールディングス" },
    "7550": { code: "7550", name: "ゼンショーホールディングス" },
    "2897": { code: "2897", name: "日清食品ホールディングス" },
    "2914": { code: "2914", name: "日本たばこ産業" },
    "9433": { code: "9433", name: "KDDI" },
    "2811": { code: "2811", name: "カゴメ" },
    "7867": { code: "7867", name: "タカラトミー" },
    "4661": { code: "4661", name: "オリエンタルランド" },
    "7752": { code: "7752", name: "リコー" },
    "2502": { code: "2502", name: "アサヒグループホールディングス" },
};

export const PRESET_STOCKS = Object.values(STOCK_MASTER);

/**
 * 優待ルールマスターデータ
 */
export const PRESET_BENEFIT_RULES: BenefitRule[] = [
    {
        stockCode: "2702",
        minShares: 100,
        vestingMonths: [6, 12],
        arrivalMonths: [9, 3],
        description: "食事無料引換券 (6枚綴)",
        category: "food",
        updatedAt: "2024-03-01",
        sourceUrl: "https://www.mcd-holdings.co.jp/ir/individual/shareholder_benefits/",
    },
    {
        stockCode: "9202",
        minShares: 100,
        vestingMonths: [3, 9],
        arrivalMonths: [5, 11],
        description: "国内線50%割引券 (1枚)",
        category: "travel",
        longTermTiers: [
            {
                minYears: 3,
                minShares: 100,
                description: "国内線50%割引券 (1枚) + 長期追加1枚",
                upgradeDescription: "+1枚追加 (3年以上)",
            },
        ],
        updatedAt: "2024-01-15",
        sourceUrl: "https://www.ana.co.jp/group/investors/stock/benefit/",
    },
    {
        stockCode: "8267",
        minShares: 100,
        vestingMonths: [2, 8],
        arrivalMonths: [4, 10],
        description: "オーナーズカード (3%キャッシュバック)",
        category: "discount",
        longTermTiers: [
            {
                minYears: 3,
                minShares: 1000,
                description: "オーナーズカード (3%) + ギフトカード2,000円分",
                upgradeDescription: "+2,000円分 (1000株以上/3年以上)",
            },
        ],
        updatedAt: "2024-02-20",
        sourceUrl: "https://www.aeon.info/ir/stock/benefit/",
    },
    {
        stockCode: "9433",
        minShares: 100,
        vestingMonths: [3],
        arrivalMonths: [6],
        description: "Pontaポイント等 (3,000円相当)",
        category: "gift",
        longTermTiers: [
            {
                minYears: 5,
                minShares: 100,
                description: "Pontaポイント等 (5,000円相当)",
                upgradeDescription: "+2,000円相当 (5年以上)",
            },
        ],
        updatedAt: "2024-05-10",
        sourceUrl: "https://www.kddi.com/corporate/ir/stock-rating/benefit/",
    },
    {
        stockCode: "9861",
        minShares: 100,
        vestingMonths: [2, 8],
        arrivalMonths: [5, 11],
        description: "株主優待券 (2,000円分)",
        category: "food",
        updatedAt: "2024-04-01",
    },
    {
        stockCode: "3197",
        minShares: 100,
        vestingMonths: [6, 12],
        arrivalMonths: [9, 3],
        description: "優待カード (2,000円分)",
        category: "food",
        updatedAt: "2024-03-10",
    },
    {
        stockCode: "7867",
        minShares: 100,
        vestingMonths: [3, 9],
        arrivalMonths: [6, 12],
        description: "オリジナルトミカ + 10%割引券",
        category: "gift",
        longTermTiers: [
            {
                minYears: 1,
                minShares: 100,
                description: "オリジナルトミカ + 30%割引券",
                upgradeDescription: "割引率30%にアップ (1年以上)",
            },
            {
                minYears: 3,
                minShares: 100,
                description: "オリジナルトミカ + 40%割引券",
                upgradeDescription: "割引率40%にアップ (3年以上)",
            },
        ],
        updatedAt: "2024-06-01",
    },
];

// ヘルパー関数群
export function getStockByCode(code: string): Stock | undefined {
    return STOCK_MASTER[code];
}

export function getBenefitRulesByCode(code: string): BenefitRule[] {
    return PRESET_BENEFIT_RULES.filter(r => r.stockCode === code);
}

export function searchStocksByName(query: string): Stock[] {
    const lowerQuery = (query || "").toLowerCase();
    return PRESET_STOCKS.filter(s =>
        s && (s.name.toLowerCase().includes(lowerQuery) || s.code.includes(query))
    );
}

export function calculateHoldingYears(acquisitionDate: string | undefined): number {
    if (!acquisitionDate) return 0;
    const acquired = new Date(acquisitionDate);
    if (isNaN(acquired.getTime())) return 0;

    const now = new Date();

    let years = now.getFullYear() - acquired.getFullYear();
    const monthDiff = now.getMonth() - acquired.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < acquired.getDate())) {
        years--;
    }

    return Math.max(0, years);
}
