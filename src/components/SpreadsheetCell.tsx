import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface SpreadsheetCellProps {
  value: any;
  columnType: string;
  onChange: (value: any) => void;
}

export const SpreadsheetCell = ({ value, columnType, onChange }: SpreadsheetCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');

  const handleBlur = () => {
    setIsEditing(false);
    onChange(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  if (columnType === 'boolean') {
    return (
      <div className="flex items-center justify-center h-full">
        <Checkbox
          checked={value === true || value === 'true'}
          onCheckedChange={(checked) => onChange(checked)}
        />
      </div>
    );
  }

  if (isEditing) {
    return (
      <Input
        type={columnType === 'number' ? 'number' : columnType === 'date' ? 'date' : 'text'}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className="h-full border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    );
  }

  return (
    <div
      className="h-full px-3 py-2 cursor-text hover:bg-accent/50 transition-colors"
      onClick={() => setIsEditing(true)}
    >
      {value || <span className="text-muted-foreground">Clique para editar</span>}
    </div>
  );
};
