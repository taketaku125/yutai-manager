"use client";

import { useState } from "react";
import { UserHolding, Stock, BenefitRule, AIBenefitResponse } from "@/types";
import { PRESET_STOCKS, getBenefitRulesByCode, searchStocksByName, calculateHoldingYears } from "@/data/staticStocks";
import { cn, CATEGORY_CONFIG } from "@/lib/utils";
import { Plus, Trash2, Sparkles, Search, X, Loader2, AlertCircle, Calendar, Clock } from "lucide-react";

interface PortfolioManagerProps {
    holdings: UserHolding[];
    customRules: BenefitRule[];
    onAddHolding: (stockCode: string, shares: number, acquisitionDate?: string) => void;
    onRemoveHolding: (stockCode: string) => void;
    onUpdateShares: (stockCode: string, shares: number) => void;
    onUpdateAcquisitionDate: (stockCode: string, date: string) => void;
    onAddCustomRule: (rule: BenefitRule) => void;
}

export function PortfolioManager({
    holdings,
    customRules,
    onAddHolding,
    onRemoveHolding,
    onUpdateShares,
    onUpdateAcquisitionDate,
    onAddCustomRule,
}: PortfolioManagerProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [shares, setShares] = useState(100);
    const [acquisitionDate, setAcquisitionDate] = useState("");
    const [isAILoading, setIsAILoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiResult, setAiResult] = useState<AIBenefitResponse | null>(null);

    const searchResults = searchQuery.length >= 1 ? searchStocksByName(searchQuery) : [];

    const handleAILookup = async () => {
        if (!searchQuery) return;

        setIsAILoading(true);
        setAiError(null);
        setAiResult(null);

        try {
            const res = await fetch("/api/benefit-lookup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stockCode: searchQuery, stockName: searchQuery }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "AI検索に失敗しました");
            }

            const data = await res.json();
            setAiResult(data);
            setSelectedStock({ code: data.stockCode, name: data.stockName });
        } catch (error) {
            setAiError(error instanceof Error ? error.message : "エラーが発生しました");
        } finally {
            setIsAILoading(false);
        }
    };

    const handleAddStock = () => {
        if (!selectedStock) return;

        onAddHolding(selectedStock.code, shares, acquisitionDate || undefined);

        // If AI result has benefits, add them as custom rules
        if (aiResult && aiResult.benefits.length > 0) {
            for (const benefit of aiResult.benefits) {
                onAddCustomRule({
                    stockCode: aiResult.stockCode,
                    minShares: benefit.minShares,
                    vestingMonths: benefit.vestingMonths,
                    arrivalMonths: benefit.arrivalMonths,
                    description: benefit.description,
                    category: benefit.category,
                    longTermTiers: benefit.longTermTiers,
                });
            }
        }

        // Reset modal state
        setIsAddModalOpen(false);
        setSearchQuery("");
        setSelectedStock(null);
        setShares(100);
        setAcquisitionDate("");
        setAiResult(null);
        setAiError(null);
    };

    // Get stock name from code
    const getStockName = (code: string): string => {
        const preset = PRESET_STOCKS.find((s) => s.code === code);
        if (preset) return preset.name;
        const customRule = customRules.find((r) => r.stockCode === code);
        return customRule ? code : code;
    };

    // Get benefit summary for a holding
    const getBenefitSummary = (stockCode: string): string => {
        const presetRules = getBenefitRulesByCode(stockCode);
        const custom = customRules.filter((r) => r.stockCode === stockCode);
        const allRules = [...presetRules, ...custom];

        if (allRules.length === 0) return "優待情報なし";

        const categories = [...new Set(allRules.map((r) => CATEGORY_CONFIG[r.category].label))];
        return categories.join("、");
    };

    // Check if holding has long-term benefits
    const getLongTermStatus = (holding: UserHolding): { years: number; hasLongTerm: boolean; applicable: string | null } => {
        const years = calculateHoldingYears(holding.acquisitionDate);
        const rules = getBenefitRulesByCode(holding.stockCode);

        for (const rule of rules) {
            if (rule.longTermTiers) {
                for (const tier of rule.longTermTiers) {
                    if (years >= tier.minYears && holding.shares >= tier.minShares) {
                        return { years, hasLongTerm: true, applicable: tier.upgradeDescription || tier.description };
                    }
                }
                // Has long-term tiers but not yet qualified
                return { years, hasLongTerm: true, applicable: null };
            }
        }
        return { years, hasLongTerm: false, applicable: null };
    };

    return (
        <>
            {/* Holdings List */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">保有銘柄</h2>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl",
                            "bg-gradient-to-r from-cyan-500 to-blue-500",
                            "text-white font-medium text-sm",
                            "hover:from-cyan-400 hover:to-blue-400 transition-all",
                            "shadow-lg shadow-cyan-500/25"
                        )}
                    >
                        <Plus className="w-4 h-4" />
                        銘柄を追加
                    </button>
                </div>

                {holdings.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-white/40 mb-2">まだ銘柄が登録されていません</p>
                        <p className="text-white/30 text-sm">「銘柄を追加」から保有株を登録してください</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {holdings.map((holding) => {
                            const longTermStatus = getLongTermStatus(holding);

                            return (
                                <div
                                    key={holding.stockCode}
                                    className={cn(
                                        "p-4 rounded-xl",
                                        "bg-white/5 border border-white/10",
                                        "hover:bg-white/10 transition-all"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-cyan-400 font-mono text-sm">{holding.stockCode}</span>
                                                <span className="font-medium text-white truncate">
                                                    {getStockName(holding.stockCode)}
                                                </span>
                                                {longTermStatus.applicable && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                                                        長期優待適用中
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-white/50 text-sm mt-0.5">
                                                {getBenefitSummary(holding.stockCode)}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={holding.shares}
                                                    onChange={(e) => onUpdateShares(holding.stockCode, parseInt(e.target.value) || 0)}
                                                    className={cn(
                                                        "w-24 px-3 py-2 rounded-lg text-right",
                                                        "bg-white/10 border border-white/20",
                                                        "text-white placeholder-white/30",
                                                        "focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                                                    )}
                                                    min={1}
                                                />
                                                <span className="text-white/50 text-sm">株</span>
                                            </div>

                                            <button
                                                onClick={() => onRemoveHolding(holding.stockCode)}
                                                className="p-2 rounded-lg text-red-400 hover:bg-red-400/20 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Acquisition Date Row */}
                                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-4 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-white/40" />
                                            <span className="text-white/50 text-sm">取得日:</span>
                                            <input
                                                type="date"
                                                value={holding.acquisitionDate || ""}
                                                onChange={(e) => onUpdateAcquisitionDate(holding.stockCode, e.target.value)}
                                                className={cn(
                                                    "px-2 py-1 rounded-lg text-sm",
                                                    "bg-white/10 border border-white/20",
                                                    "text-white",
                                                    "focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                                                )}
                                            />
                                        </div>

                                        {holding.acquisitionDate && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-white/40" />
                                                <span className="text-white/50 text-sm">
                                                    保有期間: <span className="text-white">{longTermStatus.years}年</span>
                                                </span>
                                            </div>
                                        )}

                                        {longTermStatus.hasLongTerm && !longTermStatus.applicable && holding.acquisitionDate && (
                                            <span className="text-xs text-amber-400/70">
                                                (長期優待あり - まだ条件未達成)
                                            </span>
                                        )}

                                        {longTermStatus.applicable && (
                                            <span className="text-xs text-amber-300">
                                                {longTermStatus.applicable}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add Stock Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-white">銘柄を追加</h3>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 rounded-lg text-white/50 hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <input
                                type="text"
                                placeholder="銘柄コード or 銘柄名を入力..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setSelectedStock(null);
                                    setAiResult(null);
                                }}
                                className={cn(
                                    "w-full pl-10 pr-4 py-3 rounded-xl",
                                    "bg-white/10 border border-white/20",
                                    "text-white placeholder-white/40",
                                    "focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                                )}
                            />
                        </div>

                        {/* Search Results from Preset */}
                        {searchResults.length > 0 && !selectedStock && (
                            <div className="mb-4 bg-white/5 rounded-xl border border-white/10 divide-y divide-white/10">
                                {searchResults.slice(0, 5).map((stock) => (
                                    <button
                                        key={stock.code}
                                        onClick={() => {
                                            setSelectedStock(stock);
                                            setSearchQuery(stock.code);
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
                                    >
                                        <span className="text-cyan-400 font-mono text-sm">{stock.code}</span>
                                        <span className="text-white">{stock.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* AI Lookup Button */}
                        {searchQuery && !selectedStock && searchResults.length === 0 && (
                            <div className="mb-4">
                                <button
                                    onClick={handleAILookup}
                                    disabled={isAILoading}
                                    className={cn(
                                        "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                                        "bg-gradient-to-r from-purple-500 to-pink-500",
                                        "text-white font-medium",
                                        "hover:from-purple-400 hover:to-pink-400 transition-all",
                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                >
                                    {isAILoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            AIが検索中...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            AIで優待情報を検索
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* AI Error */}
                        {aiError && (
                            <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <p className="text-red-300 text-sm">{aiError}</p>
                            </div>
                        )}

                        {/* AI Result */}
                        {aiResult && (
                            <div className="mb-4 p-4 rounded-xl bg-purple-500/20 border border-purple-500/30">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    <span className="text-purple-300 text-sm font-medium">AI検索結果</span>
                                    <span className={cn(
                                        "ml-auto text-xs px-2 py-0.5 rounded-full",
                                        aiResult.confidence === "high" && "bg-green-500/20 text-green-300",
                                        aiResult.confidence === "medium" && "bg-yellow-500/20 text-yellow-300",
                                        aiResult.confidence === "low" && "bg-orange-500/20 text-orange-300"
                                    )}>
                                        {aiResult.confidence === "high" ? "高信頼度" :
                                            aiResult.confidence === "medium" ? "中信頼度" : "低信頼度"}
                                    </span>
                                </div>
                                <p className="text-white font-medium mb-2">
                                    {aiResult.stockCode}: {aiResult.stockName}
                                </p>
                                {aiResult.benefits.length > 0 ? (
                                    <ul className="space-y-2">
                                        {aiResult.benefits.map((b, i) => (
                                            <li key={i} className="text-white/70 text-sm">
                                                • {b.description} ({b.minShares}株〜)
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-white/50 text-sm">優待なし</p>
                                )}
                            </div>
                        )}

                        {/* Selected Stock Info (with long-term tiers) */}
                        {selectedStock && !aiResult && (
                            <div className="mb-4 p-4 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                                <p className="text-cyan-300 text-sm mb-1">選択中</p>
                                <p className="text-white font-medium">
                                    {selectedStock.code}: {selectedStock.name}
                                </p>
                                {getBenefitRulesByCode(selectedStock.code).map((rule, i) => (
                                    <div key={i} className="mt-2">
                                        <p className="text-white/70 text-sm">• {rule.description}</p>
                                        {rule.longTermTiers && rule.longTermTiers.length > 0 && (
                                            <div className="ml-4 mt-1 space-y-1">
                                                {rule.longTermTiers.map((tier, j) => (
                                                    <p key={j} className="text-amber-300/80 text-xs">
                                                        → {tier.minYears}年以上保有: {tier.upgradeDescription || tier.description}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Shares and Acquisition Date Input */}
                        {(selectedStock || aiResult) && (
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">保有株数</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={shares}
                                            onChange={(e) => setShares(parseInt(e.target.value) || 100)}
                                            className={cn(
                                                "flex-1 px-4 py-3 rounded-xl",
                                                "bg-white/10 border border-white/20",
                                                "text-white text-right",
                                                "focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                                            )}
                                            min={1}
                                        />
                                        <span className="text-white/50">株</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-white/70 text-sm mb-2">
                                        取得日 <span className="text-white/40">(長期優待の計算に使用)</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={acquisitionDate}
                                        onChange={(e) => setAcquisitionDate(e.target.value)}
                                        className={cn(
                                            "w-full px-4 py-3 rounded-xl",
                                            "bg-white/10 border border-white/20",
                                            "text-white",
                                            "focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Add Button */}
                        {(selectedStock || aiResult) && (
                            <button
                                onClick={handleAddStock}
                                className={cn(
                                    "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                                    "bg-gradient-to-r from-cyan-500 to-blue-500",
                                    "text-white font-medium",
                                    "hover:from-cyan-400 hover:to-blue-400 transition-all"
                                )}
                            >
                                <Plus className="w-5 h-5" />
                                ポートフォリオに追加
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
