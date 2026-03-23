"use client";

interface TimePickerInputProps {
  hora: string;
  minuto: string;
  amPm: string;
  onHoraChange: (value: string) => void;
  onMinutoChange: (value: string) => void;
  onAmPmChange: (value: string) => void;
}

export default function TimePickerInput({
  hora,
  minuto,
  amPm,
  onHoraChange,
  onMinutoChange,
  onAmPmChange,
}: TimePickerInputProps) {
  return (
    <div className="flex bg-slate-50 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-[#8DAA68]/50 border border-transparent shadow-sm">
      <input
        type="number"
        min="1"
        max="12"
        value={hora}
        onChange={(e) => onHoraChange(e.target.value)}
        className="w-1/3 bg-transparent text-center focus:outline-none text-[#8DAA68] text-sm h-11 pt-[2px]"
      />
      <span className="py-2.5 text-[#a0a0b2] flex items-center">:</span>
      <input
        type="number"
        min="0"
        max="59"
        value={minuto}
        onChange={(e) => onMinutoChange(e.target.value)}
        className="w-1/3 bg-transparent text-center focus:outline-none text-[#8DAA68] text-sm h-11 pt-[2px]"
      />
      <select
        value={amPm}
        onChange={(e) => onAmPmChange(e.target.value)}
        className="w-1/3 bg-transparent text-[#8DAA68] text-[11px] font-bold cursor-pointer h-11 pt-1"
      >
        <option>AM</option>
        <option>PM</option>
      </select>
    </div>
  );
}
