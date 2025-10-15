"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, TableIcon } from "lucide-react";

interface ViewToggleProps {
  view: "cards" | "table";
  onViewChange: (view: "cards" | "table") => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={(v) => v && onViewChange(v as "cards" | "table")}
    >
      <ToggleGroupItem value="cards" aria-label="Card view">
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="table" aria-label="Table view">
        <TableIcon className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
