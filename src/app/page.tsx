"use client";

import { usePortfolio } from "@/hooks/usePortfolio";
import { PortfolioManager } from "@/components/PortfolioManager";
import { BenefitTimeline } from "@/components/BenefitTimeline";
import { TimelineEvent, BenefitRule, Stock } from "@/types";
import { PRESET_STOCKS, getBenefitRulesByCode, calculateHoldingYears } from "@/data/staticStocks";
import { Calendar, Sparkles, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

export default function Home() {
  const [renderError, setRenderError] = useState<string | null>(null);

  const {
    holdings,
    customRules,
    customStocks,
    isLoaded,
    isSyncing,
    addHolding,
    removeHolding,
    updateShares,
    updateAcquisitionDate,
    addCustomRule,
    addStockName,
  } = usePortfolio();

  // Reset LocalStorage helper
  const forceReset = () => {
    if (confirm("データをすべて削除して初期化しますか？")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Safe timeline generator
  const timelineEvents = useMemo(() => {
    if (!isLoaded || !Array.isArray(holdings)) return [];

    try {
      const events: TimelineEvent[] = [];

      for (const holding of holdings) {
        if (!holding || !holding.stockCode) continue;

        const presetRules = getBenefitRulesByCode(holding.stockCode) || [];
        const custom = (customRules || []).filter((r) => r && r.stockCode === holding.stockCode);
        const allRules: BenefitRule[] = [...presetRules, ...custom];

        const stock: Stock =
          (PRESET_STOCKS || []).find((s) => s && s.code === holding.stockCode) ||
          (customStocks || []).find((s) => s && s.code === holding.stockCode) ||
          {
            code: holding.stockCode,
            name: holding.stockCode,
          };

        const holdingYears = calculateHoldingYears(holding.acquisitionDate);

        for (const rule of allRules) {
          if (!rule || (holding.shares || 0) < (rule.minShares || 0)) continue;

          let finalDescription = rule.description;
          let isLongTerm = false;

          if (rule.longTermTiers && Array.isArray(rule.longTermTiers)) {
            const applicableTiers = [...rule.longTermTiers]
              .filter(t => t && holdingYears >= t.minYears && (holding.shares || 0) >= t.minShares)
              .sort((a, b) => b.minYears - a.minYears);

            if (applicableTiers.length > 0) {
              finalDescription = applicableTiers[0].description;
              isLongTerm = true;
            }
          }

          const arrivalMonths = Array.isArray(rule.arrivalMonths) ? rule.arrivalMonths : [];
          for (const month of arrivalMonths) {
            events.push({
              month,
              type: "arrival",
              stock,
              shares: holding.shares,
              description: finalDescription,
              category: rule.category,
              isLongTermBenefit: isLongTerm,
              holdingYears: holdingYears
            });
          }
        }
      }
      return events.sort((a, b) => a.month - b.month);
    } catch (e) {
      console.error("Timeline processing error:", e);
      return [];
    }
  }, [holdings, customRules, customStocks, isLoaded]);

  if (renderError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center text-white">
        <div className="max-w-md space-y-6">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold">致命的なエラー</h2>
          <p className="text-white/60 text-sm bg-black/40 p-4 rounded-xl border border-white/10">{renderError}</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> ページを再読み込み
            </button>
            <button onClick={forceReset} className="px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold">
              データを初期化して復旧
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
          <div className="text-white/40 text-sm animate-pulse">データを読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-cyan-500/30">
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">優待カレンダー</h1>
              <p className="text-white/40 text-xs">AI-Powered Benefit Manager</p>
            </div>
          </div>
          <button onClick={forceReset} title="リセット" className="p-2 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/5 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        <PortfolioManager
          holdings={holdings || []}
          customRules={customRules || []}
          customStocks={customStocks || []}
          onAddHolding={addHolding}
          onRemoveHolding={removeHolding}
          onUpdateShares={updateShares}
          onUpdateAcquisitionDate={updateAcquisitionDate}
          onAddCustomRule={addCustomRule}
          onAddStockName={addStockName}
        />

        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-semibold">年間スケジュール</h2>
            {timelineEvents.length > 0 && (
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 uppercase tracking-wider">
                {timelineEvents.length} Events
              </span>
            )}
          </div>

          {!holdings || holdings.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-white/10 border-dashed">
              <Sparkles className="w-10 h-10 text-white/10 mx-auto mb-4" />
              <p className="text-white/40">ポートフォリオに銘柄を追加してください</p>
            </div>
          ) : (
            <BenefitTimeline events={timelineEvents} />
          )}
        </section>

        {/* Legend */}
        <section className="flex flex-wrap gap-6 text-xs text-white/40 bg-white/5 p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            <span>優待到着予定月</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[10px] font-bold">長期</span>
            <span>長期保有条件達成済み</span>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-10 text-center">
        <p className="text-white/20 text-[10px] max-w-lg mx-auto leading-relaxed">
          ※本アプリの情報はAIの予測や過去のデータに基づいています。正確な情報は必ず各企業の公式サイトにてご確認ください。
        </p>
      </footer>
    </div>
  );
}
