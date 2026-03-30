"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { UserHolding, BenefitRule, Stock } from "@/types";
import { supabase } from "@/lib/supabase";

export function usePortfolio(userId: string | undefined) {
    const [holdings, setHoldings] = useState<UserHolding[]>([]);
    const [customRules, setCustomRules] = useState<BenefitRule[]>([]);
    const [customStocks, setCustomStocks] = useState<Stock[]>([]);
    const [shareId, setShareId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Initial load from Supabase
    useEffect(() => {
        if (!userId) {
            setIsLoaded(true);
            return;
        }

        async function loadData() {
            try {
                const { data, error } = await supabase
                    .from('portfolio')
                    .select('holdings, custom_rules, custom_stocks, share_id')
                    .eq('id', userId)
                    .single();

                if (error) {
                    if (error.code !== 'PGRST116') { // Record not found
                        console.error('Supabase load error:', error);
                    }
                    return;
                }

                if (data) {
                    setHoldings(data.holdings || []);
                    setCustomRules(data.custom_rules || []);
                    setCustomStocks(data.custom_stocks || []);
                    setShareId(data.share_id || null);
                }
            } catch (e) {
                console.error("Failed to load data from server", e);
            } finally {
                setIsLoaded(true);
            }
        }
        loadData();
    }, [userId]);

    // Auto-save logic (Debounced sync)
    const isFirstRun = useRef(true);
    useEffect(() => {
        if (!isLoaded || !userId) return;
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        const timer = setTimeout(async () => {
            setIsSyncing(true);
            try {
                const { error } = await supabase
                    .from('portfolio')
                    .upsert({
                        id: userId,
                        holdings,
                        custom_rules: customRules,
                        custom_stocks: customStocks,
                        updated_at: new Date().toISOString()
                    });

                if (error) throw error;
            } catch (e) {
                console.error("Failed to sync with server", e);
            } finally {
                setIsSyncing(false);
            }
        }, 800); // 800ms debounce

        return () => clearTimeout(timer);
    }, [holdings, customRules, customStocks, isLoaded, userId]);

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

    const generateShareId = async () => {
        if (!userId) return;
        const newShareId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        try {
            const { error } = await supabase
                .from('portfolio')
                .update({ share_id: newShareId })
                .eq('id', userId);
            if (error) throw error;
            setShareId(newShareId);
        } catch (e) {
            console.error("Failed to generate share ID", e);
        }
    };

    return {
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
    };
}
