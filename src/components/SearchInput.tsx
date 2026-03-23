"use client";

import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
}: SearchInputProps) {
  return (
    <div className="relative group w-full md:w-[320px]">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a0a0b2] group-hover:text-[#8DAA68] transition-colors" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-[52px] bg-white rounded-full border border-[#eef2e8] pl-12 pr-6 text-[14px] font-light text-[#3b3a62] placeholder:text-[#c4c4c4] focus:outline-none focus:border-[#8DAA68] focus:ring-1 focus:ring-[#8DAA68]/20 transition-all shadow-[0_2px_15px_rgba(0,0,0,0.02)]"
      />
    </div>
  );
}
