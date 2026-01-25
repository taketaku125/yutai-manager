"use client";

import { TimelineEvent } from "@/types";
import { CATEGORY_CONFIG, MONTH_NAMES, cn } from "@/lib/utils";
import { Calendar, Gift, Plane, UtensilsCrossed, Ticket, CreditCard } from "lucide-react";

interface BenefitTimelineProps {
    events: TimelineEvent[];
}

const CATEGORY_ICONS = {
    food: UtensilsCrossed,
    discount: Ticket,
    gift: Gift,
    qou_card: CreditCard,
    travel: Plane,
    other: Gift,
};

export function BenefitTimeline({ events }: BenefitTimelineProps) {
    // Group events by month
    const eventsByMonth: Record<number, TimelineEvent[]> = {};
    for (let i = 1; i <= 12; i++) {
        eventsByMonth[i] = events.filter((e) => e.month === i);
    }

    const currentMonth = new Date().getMonth() + 1; // 1-indexed

    return (
        <div className="relative">
            {/* Month Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                    const monthEvents = eventsByMonth[month];
                    const isCurrentMonth = month === currentMonth;

                    return (
                        <div
                            key={month}
                            className={cn(
                                "rounded-2xl p-4 transition-all duration-300",
                                "bg-white/5 backdrop-blur-sm border border-white/10",
                                "hover:bg-white/10 hover:border-white/20",
                                isCurrentMonth && "ring-2 ring-cyan-400/50 bg-cyan-400/5"
                            )}
                        >
                            {/* Month Header */}
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="w-4 h-4 text-cyan-400" />
                                <span className={cn(
                                    "font-semibold",
                                    isCurrentMonth ? "text-cyan-400" : "text-white/80"
                                )}>
                                    {MONTH_NAMES[month]}
                                </span>
                                {isCurrentMonth && (
                                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300">
                                        今月
                                    </span>
                                )}
                            </div>

                            {/* Events */}
                            <div className="space-y-2">
                                {monthEvents.length === 0 ? (
                                    <p className="text-white/30 text-sm">予定なし</p>
                                ) : (
                                    monthEvents.map((event, idx) => {
                                        const Icon = CATEGORY_ICONS[event.category];
                                        const config = CATEGORY_CONFIG[event.category];

                                        return (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "rounded-xl p-3 text-sm",
                                                    "bg-gradient-to-r from-white/5 to-transparent",
                                                    "border-l-4",
                                                    event.type === "vesting"
                                                        ? "border-l-amber-400"
                                                        : "border-l-emerald-400"
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
                                                        </div>
                                                        <p className="font-medium text-white/90 truncate">
                                                            {event.stock.name}
                                                        </p>
                                                        <p className="text-white/50 text-xs truncate mt-0.5">
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
