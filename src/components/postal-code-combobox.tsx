"use client";

import { useEffect, useRef, useState } from "react";
import { usePostalCodes, type PostalCode } from "@/hooks/use-postal-codes";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  value: string;
  onSelect: (entry: PostalCode) => void;
}

export function PostalCodeCombobox({ value, onSelect }: Props) {
  const { data: codes = [], isLoading } = usePostalCodes();
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered =
    query.length >= 1
      ? codes
          .filter(
            (c) =>
              c.cp.toLowerCase().includes(query.toLowerCase()) ||
              c.city.toLowerCase().includes(query.toLowerCase()) ||
              c.province.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 20)
      : [];

  function handleSelect(entry: PostalCode) {
    setQuery(entry.cp);
    setOpen(false);
    onSelect(entry);
  }

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        id="addr-postal"
        value={query}
        placeholder={isLoading ? "Cargando…" : "CP, ciudad o provincia"}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (query.length >= 1) setOpen(true);
        }}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <ScrollArea className="max-h-48">
            <ul className="py-1 text-sm">
              {filtered.map((c) => (
                <li
                  key={c.cp}
                  className="cursor-pointer px-3 py-1.5 hover:bg-accent hover:text-accent-foreground"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(c);
                  }}
                >
                  <span className="font-medium">{c.cp}</span>
                  <span className="ml-2 text-muted-foreground">
                    {c.city}, {c.province}
                  </span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
