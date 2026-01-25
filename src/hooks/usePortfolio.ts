"use client";

import { useEffect, useState } from "react";
import { UserHolding, BenefitRule } from "@/types";

const STORAGE_KEY = "yutai-portfolio";

export function usePortfolio() {
    const [holdings, setHoldings] = useState<UserHolding[]>([]);
    const [customRules, setCustomRules] = useState<BenefitRule[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                setHoldings(data.holdings || []);
                setCustomRules(data.customRules || []);
            } catch {
                console.error("Failed to parse portfolio data");
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage whenever data changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ holdings, customRules })
            );
        }
    }, [holdings, customRules, isLoaded]);

    const addHolding = (stockCode: string, shares: number, acquisitionDate?: string) => {
        const existing = holdings.find((h) => h.stockCode === stockCode);
        if (existing) {
            setHoldings(
                holdings.map((h) =>
                    h.stockCode === stockCode ? { ...h, shares, acquisitionDate: acquisitionDate || h.acquisitionDate } : h
                )
            );
        } else {
            setHoldings([
                ...holdings,
                {
                    stockCode,
                    shares,
                    addedAt: new Date().toISOString(),
                    acquisitionDate: acquisitionDate || new Date().toISOString()
                },
            ]);
        }
    };

    const removeHolding = (stockCode: string) => {
        setHoldings(holdings.filter((h) => h.stockCode !== stockCode));
    };

    const updateShares = (stockCode: string, shares: number) => {
        setHoldings(
            holdings.map((h) =>
                h.stockCode === stockCode ? { ...h, shares } : h
            )
        );
    };

    const updateAcquisitionDate = (stockCode: string, acquisitionDate: string) => {
        setHoldings(
            holdings.map((h) =>
                h.stockCode === stockCode ? { ...h, acquisitionDate } : h
            )
        );
    };

    const addCustomRule = (rule: BenefitRule) => {
        setCustomRules([...customRules, rule]);
    };

    return {
        holdings,
        customRules,
        isLoaded,
        addHolding,
        removeHolding,
        updateShares,
        updateAcquisitionDate,
        addCustomRule,
    };
}
