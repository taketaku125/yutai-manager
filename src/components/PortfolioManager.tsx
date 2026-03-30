"use client";

import { useState } from "react";
import { UserHolding, Stock, BenefitRule, AIBenefitResponse, BenefitCategory } from "@/types";
import { PRESET_STOCKS, getBenefitRulesByCode, searchStocksByName, calculateHoldingYears } from "@/data/staticStocks";
import { cn, CATEGORY_CONFIG } from "@/lib/utils";
import { Plus, Trash2, Sparkles, Search, X, Loader2, AlertCircle, Calendar, Clock, RefreshCw, Edit2, Save } from "lucide-react";

interface PortfolioManagerProps {
    holdings: UserHolding[];
    customRules: BenefitRule[];
    customStocks: Stock[];
    onAddHolding: (stockCode: string, shares: number, acquisitionDate?: string) => void;
    onRemoveHolding: (stockCode: string) => void;
    onUpdateShares: (stockCode: string, shares: number) => void;
    onUpdateAcquisitionDate: (stockCode: string, date: string) => void;
    onAddCustomRule: (rule: BenefitRule) => void;
    onAddStockName: (stock: Stock) => void;
}

export function PortfolioManager({
    holdings = [],
    customRules = [],
    customStocks = [],
    onAddHolding,
    onRemoveHolding,
    onUpdateShares,
    onUpdateAcquisitionDate,
    onAddCustomRule,
    onAddStockName,
}: PortfolioManagerProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Add logic state
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [shares, setShares] = useState(100);
    const [acquisitionDate, setAcquisitionDate] = useState("");
    const [isAILoading, setIsAILoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiResult, setAiResult] = useState<AIBenefitResponse | null>(null);
    const [refreshingCode, setRefreshingCode] = useState<string | null>(null);

    // Edit logic state
    const [editingStock, setEditingStock] = useState<Stock | null>(null);
    const [editDescription, setEditDescription] = useState("");
    const [editVestingMonths, setEditVestingMonths] = useState<number[]>([]);
    const [editArrivalMonths, setEditArrivalMonths] = useState<number[]>([]);
    const [editCategory, setEditCategory] = useState<BenefitCategory>("other");

    const safeSearchQuery = searchQuery || "";
    const searchResults = safeSearchQuery.length >= 1 ? searchStocksByName(safeSearchQuery) : [];

    const handleAILookup = async (codeOverride?: string) => {
        const query = codeOverride || searchQuery;
        if (!query) return;

        if (codeOverride) setRefreshingCode(codeOverride);
        else setIsAILoading(true);

        setAiError(null);
        if (!codeOverride) setAiResult(null);

        try {
            const res = await fetch("/api/benefit-lookup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stockCode: query, stockName: query }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "AI検索に失敗しました");
            }

            const data: AIBenefitResponse = await res.json();

            if (codeOverride) {
                onAddStockName({ code: data.stockCode, name: data.stockName });
                if (data.benefits && Array.isArray(data.benefits)) {
                    for (const benefit of data.benefits) {
                        onAddCustomRule({
                            stockCode: data.stockCode,
                            minShares: benefit.minShares,
                            vestingMonths: benefit.vestingMonths,
                            arrivalMonths: benefit.arrivalMonths,
                            description: benefit.description,
                            category: benefit.category,
                            longTermTiers: benefit.longTermTiers,
                            updatedAt: new Date().toISOString().split('T')[0],
                        });
                    }
                }
            } else {
                setAiResult(data);
                setSelectedStock({ code: data.stockCode, name: data.stockName });
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : "エラーが発生しました";
            if (codeOverride) alert(msg);
            else setAiError(msg);
        } finally {
            if (codeOverride) setRefreshingCode(null);
            else setIsAILoading(false);
        }
    };

    const handleAddStock = () => {
        if (!selectedStock) return;

        onAddHolding(selectedStock.code, shares, acquisitionDate || undefined);
        onAddStockName(selectedStock);

        if (aiResult && aiResult.benefits && Array.isArray(aiResult.benefits)) {
            for (const benefit of aiResult.benefits) {
                onAddCustomRule({
                    stockCode: aiResult.stockCode,
                    minShares: benefit.minShares,
                    vestingMonths: benefit.vestingMonths,
                    arrivalMonths: benefit.arrivalMonths,
                    description: benefit.description,
                    category: benefit.category,
                    longTermTiers: benefit.longTermTiers,
                    updatedAt: new Date().toISOString().split('T')[0],
                });
            }
        }

        setIsAddModalOpen(false);
        setSearchQuery("");
        setSelectedStock(null);
        setShares(100);
        setAcquisitionDate("");
        setAiResult(null);
        setAiError(null);
    };

    const openEditModal = (holding: UserHolding) => {
        const stockName = getStockName(holding.stockCode);
        const presetRules = getBenefitRulesByCode(holding.stockCode) || [];
        const custom = customRules.find(r => r.stockCode === holding.stockCode);
        const activeRule = custom || presetRules[0] || {
            stockCode: holding.stockCode,
            minShares: 100,
            vestingMonths: [],
            arrivalMonths: [],
            description: "",
            category: "other"
        };

        setEditingStock({ code: holding.stockCode, name: stockName });
        setEditDescription(activeRule.description);
        setEditVestingMonths(activeRule.vestingMonths);
        setEditArrivalMonths(activeRule.arrivalMonths);
        setEditCategory(activeRule.category);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = () => {
        if (!editingStock) return;

        // 名前を更新（もし変更があれば）
        onAddStockName(editingStock);

        // ルールを更新（手動編集なのでカスタムルールとして保存）
        onAddCustomRule({
            stockCode: editingStock.code,
            minShares: 100, // 単銘柄単位での簡易編集とするためデフォルト
            vestingMonths: editVestingMonths,
            arrivalMonths: editArrivalMonths,
            description: editDescription,
            category: editCategory,
            updatedAt: new Date().toISOString().split('T')[0],
        });

        setIsEditModalOpen(false);
        setEditingStock(null);
    };

    const toggleMonth = (month: number, list: number[], setter: (val: number[]) => void) => {
        if (list.includes(month)) {
            setter(list.filter(m => m !== month));
        } else {
            setter([...list, month].sort((a, b) => a - b));
        }
    };

    const getStockName = (code: string): string => {
        const preset = (PRESET_STOCKS || []).find((s) => s && s.code === code);
        if (preset) return preset.name;
        const custom = (customStocks || []).find((s) => s && s.code === code);
        return custom ? custom.name : code;
    };

    const getBenefitSummary = (stockCode: string): string => {
        const presetRules = getBenefitRulesByCode(stockCode) || [];
        const custom = (customRules || []).filter((r) => r && r.stockCode === stockCode);
        const allRules = [...presetRules, ...custom];

        if (allRules.length === 0) return "優待情報なし";

        const currentRule = custom[0] || presetRules[0];
        return currentRule.description;
    };

    const getLongTermStatus = (holding: UserHolding): { years: number; hasLongTerm: boolean; applicable: string | null } => {
        const years = calculateHoldingYears(holding.acquisitionDate);
        const presetRules = getBenefitRulesByCode(holding.stockCode) || [];
        const custom = (customRules || []).filter((r) => r && r.stockCode === holding.stockCode);
        const allRules = [...presetRules, ...custom];

        for (const rule of allRules) {
            if (rule && rule.longTermTiers && Array.isArray(rule.longTermTiers)) {
                const sortedTiers = [...rule.longTermTiers].sort((a, b) => b.minYears - a.minYears);
                for (const tier of sortedTiers) {
                    if (tier && years >= tier.minYears && holding.shares >= tier.minShares) {
                        return { years, hasLongTerm: true, applicable: tier.upgradeDescription || tier.description };
                    }
                }
                return { years, hasLongTerm: true, applicable: null };
            }
        }
        return { years, hasLongTerm: false, applicable: null };
    };

    return (
        <>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">保有銘柄</h2>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl",
                            "bg-gradient-to-r from-cyan-500 to-blue-500",
                            "text-white font-medium text-sm",
                            "hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/25"
                        )}
                    >
                        <Plus className="w-4 h-4" />
                        銘柄を追加
                    </button>
                </div>

                {(!holdings || holdings.length === 0) ? (
                    <div className="text-center py-12">
                        <p className="text-white/40 mb-2">まだ銘柄が登録されていません</p>
                        <p className="text-white/30 text-sm">「銘柄を追加」から保有株を登録してください</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {holdings.map((holding) => {
                            if (!holding) return null;
                            const longTermStatus = getLongTermStatus(holding);
                            const isRefreshing = refreshingCode === holding.stockCode;

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
                                                <span className="font-medium text-white break-words">
                                                    {getStockName(holding.stockCode)}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => openEditModal(holding)}
                                                        title="手動で編集"
                                                        className="p-1 rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAILookup(holding.stockCode)}
                                                        disabled={isRefreshing}
                                                        title="最新情報をAIで取得"
                                                        className="p-1 rounded-md text-white/30 hover:text-cyan-400 hover:bg-white/5 transition-all"
                                                    >
                                                        <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
                                                    </button>
                                                </div>
                                                {longTermStatus.applicable && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                                                        長期優待適用中
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-white/50 text-sm mt-0.5 break-words">
                                                {getBenefitSummary(holding.stockCode)}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={holding.shares || 0}
                                                    onChange={(e) => onUpdateShares(holding.stockCode, parseInt(e.target.value) || 0)}
                                                    className={cn(
                                                        "w-24 px-3 py-2 rounded-lg text-right",
                                                        "bg-white/10 border border-white/20",
                                                        "text-white placeholder-white/30",
                                                        "focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                                                    )}
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
                                            <span className="text-xs text-amber-400/70">(条件未達成)</span>
                                        )}
                                        {longTermStatus.applicable && (
                                            <span className="text-xs text-amber-300">{longTermStatus.applicable}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Edit Stock Modal */}
            {
                isEditModalOpen && editingStock && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
                        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-500/20">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-white">優待内容の編集</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="p-2 rounded-lg text-white/50 hover:bg-white/10"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">銘柄名</label>
                                    <input
                                        type="text"
                                        value={editingStock.name}
                                        onChange={(e) => setEditingStock({ ...editingStock, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/70 text-sm mb-2">カテゴリ</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                                            <button
                                                key={key}
                                                onClick={() => setEditCategory(key as BenefitCategory)}
                                                className={cn(
                                                    "px-2 py-2 rounded-lg text-xs font-medium border transition-all",
                                                    editCategory === key
                                                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                                                        : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                                                )}
                                            >
                                                {config.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-white/70 text-sm mb-2">優待の詳細内容</label>
                                    <textarea
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/70 text-sm mb-2">権利確定月</label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <button
                                                key={m}
                                                onClick={() => toggleMonth(m, editVestingMonths, setEditVestingMonths)}
                                                className={cn(
                                                    "py-2 rounded-lg text-xs font-medium transition-all",
                                                    editVestingMonths.includes(m) ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-white/5 text-white/40 hover:bg-white/10"
                                                )}
                                            >
                                                {m}月
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-white/70 text-sm mb-2">優待が届く月（目安）</label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <button
                                                key={m}
                                                onClick={() => toggleMonth(m, editArrivalMonths, setEditArrivalMonths)}
                                                className={cn(
                                                    "py-2 rounded-lg text-xs font-medium transition-all",
                                                    editArrivalMonths.includes(m) ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 text-white/40 hover:bg-white/10"
                                                )}
                                            >
                                                {m}月
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveEdit}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
                                >
                                    <Save className="w-5 h-5" />
                                    変更を保存して反映
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add Stock Modal - (Keep as is) */}
            {
                isAddModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
                        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-500/20">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-white">銘柄を追加</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-lg text-white/50 hover:bg-white/10"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="例: 2702, マクドナルド"
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

                            {searchQuery && !selectedStock && searchResults.length === 0 && (
                                <div className="mb-4">
                                    <button
                                        onClick={() => handleAILookup()}
                                        disabled={isAILoading}
                                        className={cn(
                                            "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                                            "bg-gradient-to-r from-purple-500 to-pink-500",
                                            "text-white font-medium",
                                            "hover:from-purple-400 hover:to-pink-400 transition-all shadow-lg"
                                        )}
                                    >
                                        {isAILoading ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" />AIが検索中...</>
                                        ) : (
                                            <><Sparkles className="w-5 h-5" />AIで優待情報を検索</>
                                        )}
                                    </button>
                                </div>
                            )}

                            {aiError && (
                                <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-300 text-sm">{aiError}</p>
                                </div>
                            )}

                            {aiResult && (
                                <div className="mb-4 p-4 rounded-xl bg-purple-500/20 border border-purple-500/30">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-4 h-4 text-purple-400" />
                                        <span className="text-purple-300 text-sm font-medium">AI検索結果</span>
                                    </div>
                                    <p className="text-white font-medium mb-2">{aiResult.stockCode}: {aiResult.stockName}</p>
                                    {aiResult.benefits && Array.isArray(aiResult.benefits) && aiResult.benefits.length > 0 ? (
                                        <ul className="space-y-2">
                                            {aiResult.benefits.map((b, i) => (
                                                <li key={i} className="text-white/70 text-sm">• {b.description} ({b.minShares}株〜)</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-white/50 text-sm">優待なし</p>
                                    )}
                                </div>
                            )}

                            {(selectedStock || aiResult) && (
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-white/70 text-sm mb-2">保有株数</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={shares}
                                                onChange={(e) => setShares(parseInt(e.target.value) || 100)}
                                                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-right focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                                            />
                                            <span className="text-white/50">株</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-white/70 text-sm mb-2">取得日 (任意)</label>
                                        <input
                                            type="date"
                                            value={acquisitionDate}
                                            onChange={(e) => setAcquisitionDate(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                                        />
                                    </div>
                                </div>
                            )}

                            {(selectedStock || aiResult) && (
                                <button
                                    onClick={handleAddStock}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg"
                                >
                                    <Plus className="w-5 h-5" />ポートフォリオに追加
                                </button>
                            )}
                        </div>
                    </div>
                )
            }
        </>
    );
}
