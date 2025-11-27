import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface ColumnHeaderProps {
  name: string;
  type: string;
  onNameChange: (name: string) => void;
  onTypeChange: (type: string) => void;
  onDelete: () => void;
}

export const ColumnHeader = ({ name, type, onNameChange, onTypeChange, onDelete }: ColumnHeaderProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [localName, setLocalName] = useState(name);

  const handleNameBlur = () => {
    setIsEditingName(false);
    onNameChange(localName);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    }
    if (e.key === 'Escape') {
      setLocalName(name);
      setIsEditingName(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-2 bg-muted border-b border-r min-w-[200px]">
      <div className="flex items-center justify-between gap-2">
        {isEditingName ? (
          <Input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            autoFocus
            className="h-8 text-sm font-medium"
          />
        ) : (
          <div
            className="flex-1 cursor-text px-2 py-1 rounded hover:bg-background transition-colors font-medium"
            onClick={() => setIsEditingName(true)}
          >
            {name || <span className="text-muted-foreground">Nome da coluna</span>}
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <Select value={type} onValueChange={onTypeChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="text">Texto</SelectItem>
          <SelectItem value="number">Número</SelectItem>
          <SelectItem value="date">Data</SelectItem>
          <SelectItem value="boolean">Sim/Não</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
