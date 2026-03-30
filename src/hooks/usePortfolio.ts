"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { UserHolding, BenefitRule, Stock } from "@/types";

export function usePortfolio() {
    const [holdings, setHoldings] = useState<UserHolding[]>([]);
    const [customRules, setCustomRules] = useState<BenefitRule[]>([]);
    const [customStocks, setCustomStocks] = useState<Stock[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // 初回読み込み
    useEffect(() => {
        async function loadData() {
            try {
                // キャッシュ回避のためにランダムなクエリを付与
                const res = await fetch(`/api/portfolio?t=${Date.now()}`, {
                    cache: 'no-store'
                });
                if (res.ok) {
                    const data = await res.json();
                    setHoldings(data.holdings || []);
                    setCustomRules(data.customRules || []);
                    setCustomStocks(data.customStocks || []);
                }
            } catch (e) {
                console.error("Failed to load data from server", e);
            } finally {
                setIsLoaded(true);
            }
        }
        loadData();
    }, []);

    // 自動保存ロジック (Debounced sync)
    const isFirstRun = useRef(true);
    useEffect(() => {
        if (!isLoaded) return;
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        const timer = setTimeout(async () => {
            setIsSyncing(true);
            try {
                await fetch("/api/portfolio", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ holdings, customRules, customStocks }),
                });
            } catch (e) {
                console.error("Failed to sync with server", e);
            } finally {
                setIsSyncing(false);
            }
        }, 500); // 500msのデバウンス

        return () => clearTimeout(timer);
    }, [holdings, customRules, customStocks, isLoaded]);

    const addHolding = (stockCode: string, shares: number, acquisitionDate?: string) => {
        setHoldings(prev => {
            const existing = prev.find((h) => h.stockCode === stockCode);
            if (existing) {
                return prev.map((h) =>
                    h.stockCode === stockCode ? { ...h, shares, acquisitionDate: acquisitionDate || h.acquisitionDate } : h
                );
            }
            return [
                ...prev,
                {
                    stockCode,
                    shares,
                    addedAt: new Date().toISOString(),
                    acquisitionDate: acquisitionDate || new Date().toISOString()
                },
            ];
        });
    };

    const removeHolding = (stockCode: string) => {
        setHoldings(prev => prev.filter((h) => h.stockCode !== stockCode));
    };

    const updateShares = (stockCode: string, shares: number) => {
        setHoldings(prev =>
            prev.map((h) =>
                h.stockCode === stockCode ? { ...h, shares } : h
            )
        );
    };

    const updateAcquisitionDate = (stockCode: string, acquisitionDate: string) => {
        setHoldings(prev =>
            prev.map((h) =>
                h.stockCode === stockCode ? { ...h, acquisitionDate } : h
            )
        );
    };

    const addCustomRule = (rule: BenefitRule) => {
        setCustomRules(prev => {
            const current = Array.isArray(prev) ? prev : [];
            const filtered = current.filter(r => r.stockCode !== rule.stockCode);
            return [...filtered, rule];
        });
    };

    const addStockName = (stock: Stock) => {
        setCustomStocks(prev => {
            const current = Array.isArray(prev) ? prev : [];
            const exists = current.find(s => s.code === stock.code);
            if (exists) {
                if (exists.name === stock.name) return current;
                return current.map(s => s.code === stock.code ? stock : s);
            }
            return [...current, stock];
        });
    };

    return {
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
    };
}
