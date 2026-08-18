"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NicheAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  id?: string;
  name?: string;
  className?: string;
  inputClassName?: string;
}

// Free-text input with a filtered suggestion dropdown — never blocks typing
// a custom value. Suggestions are shown on focus (full list if the field is
// empty, filtered as the user types) and can be picked with mouse or
// keyboard (Up/Down + Enter), or ignored entirely.
export function NicheAutocomplete({
  value, onChange, suggestions, placeholder, id, name, className, inputClassName,
}: NicheAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = value.trim()
    ? suggestions.filter((s) => s.toLowerCase().includes(value.trim().toLowerCase()))
    : suggestions;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setHighlighted(0);
  }, [value, open]);

  function select(v: string) {
    onChange(v);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      select(filtered[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <Input
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        className={inputClassName}
      />

      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 shadow-2xl z-50">
          {filtered.map((s, i) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(s)}
              className={cn(
                "w-full flex items-center px-3 py-2 text-sm text-left transition-colors",
                i === highlighted
                  ? "bg-violet-500/15 text-violet-300"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
