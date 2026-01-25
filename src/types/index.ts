// 銘柄情報
export interface Stock {
  code: string;      // 証券コード (例: "2702")
  name: string;      // 銘柄名 (例: "日本マクドナルドホールディングス")
}

// 長期保有優待の段階
export interface LongTermTier {
  minYears: number;           // 最低保有年数
  minShares: number;          // 必要最低株数
  description: string;        // 優待内容（長期保有時）
  upgradeDescription?: string; // 通常との差分説明 (例: "+2,000円分追加")
}

// 優待ルール
export interface BenefitRule {
  stockCode: string;
  minShares: number;           // 必要最低株数
  vestingMonths: number[];     // 権利確定月 (1-12)
  arrivalMonths: number[];     // 届く月(目安) (1-12)
  description: string;         // 優待内容
  category: BenefitCategory;
  longTermTiers?: LongTermTier[];  // 長期保有優待（段階別）
  updatedAt?: string;          // 最終更新日 (YYYY-MM-DD)
  sourceUrl?: string;          // 情報元URL (IRページ等)
}

// 優待カテゴリ
export type BenefitCategory =
  | "food"           // 食事券・食品
  | "discount"       // 割引券
  | "gift"           // ギフト・商品
  | "qou_card"       // QUOカード
  | "travel"         // 旅行・宿泊
  | "other";

// ユーザーの保有情報
export interface UserHolding {
  stockCode: string;
  shares: number;
  addedAt: string;           // アプリに追加した日 (ISO date string)
  acquisitionDate?: string;  // 実際の取得日 (ISO date string) - ユーザーが入力
}

// タイムラインイベント
export interface TimelineEvent {
  month: number;           // 1-12
  type: "vesting" | "arrival";
  stock: Stock;
  shares: number;
  description: string;
  category: BenefitCategory;
  isLongTermBenefit?: boolean;    // 長期保有優待かどうか
  holdingYears?: number;          // 保有年数
}

// AIから取得した優待情報のレスポンス
export interface AIBenefitResponse {
  stockCode: string;
  stockName: string;
  benefits: {
    minShares: number;
    vestingMonths: number[];
    arrivalMonths: number[];
    description: string;
    category: BenefitCategory;
    longTermTiers?: LongTermTier[];
  }[];
  confidence: "high" | "medium" | "low";
  source: string;
}
