"use client";

import { usePortfolio } from "@/hooks/usePortfolio";
import { PortfolioManager } from "@/components/PortfolioManager";
import { BenefitTimeline } from "@/components/BenefitTimeline";
import { TimelineEvent, BenefitRule, Stock } from "@/types";
import { PRESET_STOCKS, getBenefitRulesByCode, calculateHoldingYears } from "@/data/staticStocks";
import { Auth } from "@/components/Auth";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { Calendar, Sparkles, Loader2, AlertTriangle, RefreshCw, LogOut, Share2, X, Copy, Check, ExternalLink } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const {
    holdings,
    customRules,
    customStocks,
    shareId,
    isLoaded,
    isSyncing,
    addHolding,
    removeHolding,
    updateShares,
    updateAcquisitionDate,
    addCustomRule,
    addStockName,
    generateShareId,
  } = usePortfolio(session?.user?.id);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
          <div className="text-slate-400 text-sm animate-pulse">データを読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 selection:bg-cyan-500/30">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">優待カレンダー</h1>
              <p className="text-slate-400 text-xs">AI-Powered Benefit Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-cyan-600 hover:bg-cyan-50 transition-all text-sm font-medium border border-cyan-100"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">共有</span>
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1 hidden sm:block" />
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">ログアウト</span>
            </button>
            <button onClick={forceReset} title="リセット" className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
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
            <Calendar className="w-5 h-5 text-cyan-600" />
            <h2 className="text-xl font-semibold text-slate-900">年間スケジュール</h2>
            {timelineEvents.length > 0 && (
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 uppercase tracking-wider">
                {timelineEvents.length} Events
              </span>
            )}
          </div>

          {!holdings || holdings.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-200 border-dashed">
              <Sparkles className="w-10 h-10 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400">ポートフォリオに銘柄を追加してください</p>
            </div>
          ) : (
            <BenefitTimeline events={timelineEvents} />
          )}
        </section>

        {/* Legend */}
        <section className="flex flex-wrap gap-6 text-xs text-slate-400 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
            <span>優待到着予定月</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold">長期</span>
            <span>長期保有条件達成済み</span>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-10 text-center">
        <p className="text-slate-400 text-[10px] max-w-lg mx-auto leading-relaxed">
          ※本アプリの情報はAIの予測や過去のデータに基づいています。正確な情報は必ず各企業の公式サイトにてご確認ください。
        </p>
      </footer>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-cyan-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">ポートフォリオを共有</h3>
              </div>
              <button onClick={() => setIsShareModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              共有用URLを作成すると、他のユーザーがあなたのポートフォリオ（閲覧専用）を見ることができるようになります。
            </p>

            {!shareId ? (
              <button
                onClick={generateShareId}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2"
              >
                共有用URLを発行する
              </button>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">共有用URL</label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={`${window.location.origin}/p/${shareId}`}
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/p/${shareId}`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className={cn(
                        "px-4 py-3 rounded-xl transition-all flex items-center justify-center",
                        copied ? "bg-emerald-500 text-white" : "bg-slate-900 text-white hover:bg-slate-800"
                      )}
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <a
                  href={`/p/${shareId}`}
                  target="_blank"
                  className="flex items-center justify-center gap-2 text-cyan-600 text-sm font-semibold hover:text-cyan-700 transition-colors py-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  プレビューを表示
                </a>

                <div className="pt-6 border-t border-slate-100 italic text-[10px] text-slate-400 text-center">
                  URLを知っている人なら誰でも閲覧可能です。
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
