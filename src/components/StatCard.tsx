"use client";

import { ReactNode } from "react";
import type { StatCardProps } from "@/types";

const colorMap: Record<string, string> = {
  blue: "text-[#6366f1] bg-[#eef2ff]",
  orange: "text-[#fc855f] bg-[#fff4f1]",
  teal: "text-[#14b8a6] bg-[#f0fdfa]",
  green: "text-[#8DAA68] bg-[#f4f7f0]",
};

export default function StatCard({ icon, title, value, trend, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-[2rem] p-7 md:p-8 border border-[#fcfcfd] shadow-[0_8px_40px_rgba(0,0,0,0.02)] flex items-center gap-6 hover:shadow-[0_12px_50px_rgba(0,0,0,0.04)] transition-all transform hover:-translate-y-1">
      <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <h4 className="text-[#a0a0b2] text-[15px] font-light mb-1">{title}</h4>
        <div className="text-3xl font-light text-[#3b3a62]">{value}</div>
        <p className="text-xs text-[#a0a0b2] mt-2 font-light italic">{trend}</p>
      </div>
    </div>
  );
}
