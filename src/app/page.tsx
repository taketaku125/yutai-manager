"use client";

import { usePortfolio } from "@/hooks/usePortfolio";
import { PortfolioManager } from "@/components/PortfolioManager";
import { BenefitTimeline } from "@/components/BenefitTimeline";
import { TimelineEvent, BenefitRule, Stock } from "@/types";
import { PRESET_STOCKS, getBenefitRulesByCode, calculateHoldingYears } from "@/data/staticStocks";
import { Calendar, Sparkles } from "lucide-react";

export default function Home() {
  const {
    holdings,
    customRules,
    isLoaded,
    addHolding,
    removeHolding,
    updateShares,
    updateAcquisitionDate,
    addCustomRule,
  } = usePortfolio();

  // Generate timeline events from holdings
  const generateTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    const now = new Date();

    for (const holding of holdings) {
      // Get rules from preset
      const presetRules = getBenefitRulesByCode(holding.stockCode);
      // Get custom rules (from AI or manual)
      const custom = customRules.filter((r) => r.stockCode === holding.stockCode);
      const allRules: BenefitRule[] = [...presetRules, ...custom];

      // Get stock info
      const stock: Stock =
        PRESET_STOCKS.find((s) => s.code === holding.stockCode) || {
          code: holding.stockCode,
          name: holding.stockCode,
        };

      // Calculate holding period
      const holdingYears = calculateHoldingYears(holding.acquisitionDate);

      for (const rule of allRules) {
        // Check if user has enough shares
        if (holding.shares < rule.minShares) continue;

        // Determine description (check for long-term tiers)
        let finalDescription = rule.description;
        let isLongTerm = false;

        if (rule.longTermTiers) {
          // Sort by years descending to get the highest applicable tier
          const applicableTiers = [...rule.longTermTiers]
            .filter(t => holdingYears >= t.minYears && holding.shares >= t.minShares)
            .sort((a, b) => b.minYears - a.minYears);

          if (applicableTiers.length > 0) {
            finalDescription = applicableTiers[0].description;
            isLongTerm = true;
          }
        }

        // Add vesting events
        for (const month of rule.vestingMonths) {
          events.push({
            month,
            type: "vesting",
            stock,
            shares: holding.shares,
            description: finalDescription,
            category: rule.category,
            isLongTermBenefit: isLongTerm,
            holdingYears: holdingYears
          });
        }

        // Add arrival events
        for (const month of rule.arrivalMonths) {
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

    // Sort by month...
    events.sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month;
      if (a.type === "vesting" && b.type === "arrival") return -1;
      if (a.type === "arrival" && b.type === "vesting") return 1;
      return 0;
    });

    return events;
  };

  const timelineEvents = isLoaded ? generateTimelineEvents() : [];

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-white/50">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">優待カレンダー</h1>
            <p className="text-white/50 text-sm">株主優待の年間スケジュールを管理</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-white/40 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>AI対応</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Portfolio Manager */}
        <PortfolioManager
          holdings={holdings}
          customRules={customRules}
          onAddHolding={addHolding}
          onRemoveHolding={removeHolding}
          onUpdateShares={updateShares}
          onUpdateAcquisitionDate={updateAcquisitionDate}
          onAddCustomRule={addCustomRule}
        />

        {/* Timeline Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">年間タイムライン</h2>
            {timelineEvents.length > 0 && (
              <span className="ml-2 text-sm text-white/50">
                {timelineEvents.length}件のイベント
              </span>
            )}
          </div>

          {holdings.length === 0 ? (
            <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
              <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40 mb-2">タイムラインを表示するには</p>
              <p className="text-white/30 text-sm">保有銘柄を追加してください</p>
            </div>
          ) : (
            <BenefitTimeline events={timelineEvents} />
          )}
        </section>

        {/* Legend */}
        <section className="flex flex-wrap gap-4 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-amber-400" />
            <span>権利確定日</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-emerald-400" />
            <span>到着予定日</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-white/30 text-sm">
        <p>※優待情報は目安です。最新情報は各企業のIRをご確認ください。</p>
      </footer>
    </div>
  );
}
