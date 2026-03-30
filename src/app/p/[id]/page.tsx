'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BenefitTimeline } from '@/components/BenefitTimeline';
import { TimelineEvent, BenefitRule, Stock, UserHolding } from '@/types';
import { PRESET_STOCKS, getBenefitRulesByCode, calculateHoldingYears } from '@/data/staticStocks';
import { Calendar, Sparkles, Loader2, AlertTriangle, Info } from 'lucide-react';

export default function SharedPortfolio() {
    const params = useParams();
    const shareId = params.id as string;
    const [data, setData] = useState<{ holdings: UserHolding[], customRules: BenefitRule[], customStocks: Stock[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!shareId) return;

        async function fetchSharedData() {
            try {
                const { data: portfolio, error } = await supabase
                    .from('portfolio')
                    .select('holdings, custom_rules, custom_stocks')
                    .eq('share_id', shareId)
                    .single();

                if (error) {
                    throw new Error('ポートフォリオが見つかりません');
                }

                if (portfolio) {
                    setData({
                        holdings: portfolio.holdings || [],
                        customRules: portfolio.custom_rules || [],
                        customStocks: portfolio.custom_stocks || []
                    });
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchSharedData();
    }, [shareId]);

    const timelineEvents = useMemo(() => {
        if (!data || !Array.isArray(data.holdings)) return [];

        const events: TimelineEvent[] = [];
        for (const holding of data.holdings) {
            if (!holding || !holding.stockCode) continue;

            const presetRules = getBenefitRulesByCode(holding.stockCode) || [];
            const custom = (data.customRules || []).filter((r) => r && r.stockCode === holding.stockCode);
            const allRules: BenefitRule[] = [...presetRules, ...custom];

            const stock: Stock =
                (PRESET_STOCKS || []).find((s) => s && s.code === holding.stockCode) ||
                (data.customStocks || []).find((s) => s && s.code === holding.stockCode) ||
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
    }, [data]);

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-6">
                    <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-slate-900">ポートフォリオが見つかりません</h2>
                    <p className="text-slate-500">{error || 'URLを確認してください。'}</p>
                    <a href="/" className="inline-block px-6 py-3 bg-cyan-600 text-white rounded-xl font-bold">
                        トップへ戻る
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 text-slate-900 pb-20">
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
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-12 space-y-12">
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 text-cyan-700 text-sm font-medium border border-cyan-100">
                        <Info className="w-4 h-4" /> 共有されたポートフォリオ
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900">公開ポートフォリオ</h2>
                    <p className="text-slate-500 max-w-lg mx-auto">
                        このポートフォリオは他のユーザーによって共有されています。
                        最新の優待内容とスケジュールを確認できます。
                    </p>
                </section>

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

                    {timelineEvents.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-200 border-dashed">
                            <Sparkles className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400">表示できる銘柄がありません</p>
                        </div>
                    ) : (
                        <BenefitTimeline events={timelineEvents} />
                    )}
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                             <Sparkles className="w-4 h-4 text-cyan-600" />
                             保有銘柄一覧
                        </h3>
                        <div className="space-y-3">
                            {data.holdings.map((h, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400 font-mono">{h.stockCode}</span>
                                        <span className="font-medium text-slate-800">
                                             {(PRESET_STOCKS.find(s => s.code === h.stockCode)?.name) || 
                                              (data.customStocks.find(s => s.code === h.stockCode)?.name) || 
                                              h.stockCode}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-slate-900">{h.shares}</span>
                                        <span className="text-xs text-slate-400 ml-1 font-medium">株</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-semibold mb-4 text-slate-800">凡例</h3>
                        <div className="space-y-4 text-sm text-slate-500">
                             <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                                <span>優待到着予定月</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold">長期</span>
                                <span>長期保有条件達成済み</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="text-center py-10 opacity-50 px-4">
                <p className="text-xs text-slate-400">
                    ※表示されている情報は共有時点のものです。自分でもポートフォリオを管理したい場合はログインしてください。
                </p>
            </footer>
        </div>
    );
}
