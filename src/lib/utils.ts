import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// カテゴリの日本語名とアイコン色
export const CATEGORY_CONFIG = {
    food: { label: "食事券・食品", color: "bg-orange-500" },
    discount: { label: "割引券", color: "bg-blue-500" },
    gift: { label: "ギフト・商品", color: "bg-purple-500" },
    qou_card: { label: "QUOカード", color: "bg-green-500" },
    travel: { label: "旅行・宿泊", color: "bg-pink-500" },
    other: { label: "その他", color: "bg-gray-500" },
};

// 月の名前
export const MONTH_NAMES = [
    "", "1月", "2月", "3月", "4月", "5月", "6月",
    "7月", "8月", "9月", "10月", "11月", "12月"
];
