import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export default function EmptyState({ 
  icon = <Inbox className="w-12 h-12 text-[#8DAA68]/20" />, 
  title, 
  description, 
  className = "" 
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 px-4 text-center bg-white/50 backdrop-blur-sm rounded-[2rem] border border-[#eef2e8] border-dashed ${className}`}>
      <div className="mb-6 bg-[#f4f7f0] w-24 h-24 rounded-full flex items-center justify-center shadow-inner">
        {icon}
      </div>
      <h3 className="text-[#3b3a62] font-medium text-lg mb-2">{title}</h3>
      <p className="text-[#a0a0b2] text-[14px] font-light max-w-sm">
        {description}
      </p>
    </div>
  );
}
