"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  paginaActual: number;
  totalPaginas: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ paginaActual, totalPaginas, onPageChange }: PaginationProps) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="flex justify-center flex-wrap items-center gap-3 mt-12 mb-4">
      <button
        onClick={() => onPageChange(Math.max(1, paginaActual - 1))}
        disabled={paginaActual === 1}
        className="w-10 h-10 rounded-full flex items-center justify-center text-[#a0a0b2] bg-white shadow-sm hover:bg-[#f4f7f0] hover:text-[#8DAA68] transition-all disabled:opacity-40"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-full shadow-sm">
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
              paginaActual === p
                ? "bg-gradient-to-r from-[#8DAA68] to-[#6b844b] text-white shadow-md"
                : "text-[#a0a0b2] hover:bg-[#f4f7f0] hover:text-[#8DAA68]"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPaginas, paginaActual + 1))}
        disabled={paginaActual === totalPaginas}
        className="w-10 h-10 rounded-full flex items-center justify-center text-[#a0a0b2] bg-white shadow-sm hover:bg-[#f4f7f0] hover:text-[#8DAA68] transition-all disabled:opacity-40"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
