import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SpreadsheetCardProps {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  columnCount: number;
  rowCount: number;
  onDelete: () => void;
}

export const SpreadsheetCard = ({
  id,
  projectId,
  name,
  description,
  columnCount,
  rowCount,
  onDelete,
}: SpreadsheetCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="p-6 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate(`/projects/${projectId}/spreadsheets/${id}`)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📊</span>
            <h3 className="font-semibold text-lg">{name}</h3>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {columnCount} {columnCount === 1 ? 'coluna' : 'colunas'} • {rowCount} {rowCount === 1 ? 'linha' : 'linhas'}
          </p>
        </div>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/projects/${projectId}/spreadsheets/${id}`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
