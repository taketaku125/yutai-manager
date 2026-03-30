"use client";

import { TimelineEvent } from "@/types";
import { CATEGORY_CONFIG, MONTH_NAMES, cn } from "@/lib/utils";
import { Calendar, Gift, Plane, UtensilsCrossed, Ticket, CreditCard, type LucideIcon } from "lucide-react";

interface BenefitTimelineProps {
    events: TimelineEvent[];
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
    food: UtensilsCrossed,
    discount: Ticket,
    gift: Gift,
    qou_card: CreditCard,
    travel: Plane,
    other: Gift,
};

export function BenefitTimeline({ events = [] }: BenefitTimelineProps) {
    // Arrayチェック
    const safeEvents = Array.isArray(events) ? events : [];

    // Group events by month
    const eventsByMonth: Record<number, TimelineEvent[]> = {};
    for (let i = 1; i <= 12; i++) {
        eventsByMonth[i] = safeEvents.filter((e) => e && e.month === i);
    }

    const currentMonth = new Date().getMonth() + 1; // 1-indexed

    return (
        <div className="relative">
            {/* Month Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                    const monthEvents = eventsByMonth[month] || [];
                    const isCurrentMonth = month === currentMonth;

                    return (
                        <div
                            key={month}
                            className={cn(
                                "rounded-2xl p-4 transition-all duration-300",
                                "bg-white shadow-sm border border-slate-200",
                                "hover:shadow-md hover:border-slate-300",
                                isCurrentMonth && "ring-2 ring-cyan-500/50 bg-cyan-50"
                            )}
                        >
                            {/* Month Header */}
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="w-4 h-4 text-cyan-600" />
                                <span className={cn(
                                    "font-semibold",
                                    isCurrentMonth ? "text-cyan-600" : "text-slate-700"
                                )}>
                                    {MONTH_NAMES[month]}
                                </span>
                                {isCurrentMonth && (
                                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700">
                                        今月
                                    </span>
                                )}
                            </div>

                            {/* Events */}
                            <div className="space-y-2">
                                {monthEvents.length === 0 ? (
                                    <p className="text-slate-300 text-sm">予定なし</p>
                                ) : (
                                    monthEvents.map((event, idx) => {
                                        if (!event || !event.category || !event.stock) return null;

                                        const Icon = CATEGORY_ICONS[event.category] || Gift;
                                        const config = CATEGORY_CONFIG[event.category] || { label: "その他", color: "bg-slate-500" };

                                        return (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "rounded-xl p-3 text-sm",
                                                    "bg-slate-50",
                                                    "border-l-4",
                                                    event.type === "vesting"
                                                        ? "border-l-amber-500"
                                                        : "border-l-emerald-500"
                                                )}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <div
                                                        className={cn(
                                                            "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                                                            config.color
                                                        )}
                                                    >
                                                        <Icon className="w-3 h-3 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1 mb-0.5">
                                                            <span
                                                                className={cn(
                                                                    "text-xs px-1.5 py-0.5 rounded-md font-medium",
                                                                    event.type === "vesting"
                                                                        ? "bg-amber-400/20 text-amber-300"
                                                                        : "bg-emerald-400/20 text-emerald-300"
                                                                )}
                                                            >
                                                                {event.type === "vesting" ? "権利確定" : "到着予定"}
                                                            </span>
                                                            {event.isLongTermBenefit && (
                                                                <span className="text-[10px] px-1 rounded bg-amber-500/20 text-amber-300">長期</span>
                                                            )}
                                                        </div>
                                                        <p className="font-medium text-slate-800 break-words">
                                                            {event.stock.name || event.stock.code}
                                                        </p>
                                                        <p className="text-slate-500 text-xs mt-1 break-words">
                                                            {event.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
