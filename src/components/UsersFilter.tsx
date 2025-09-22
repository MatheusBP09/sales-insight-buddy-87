import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  X, 
  Building2, 
  Activity, 
  TrendingUp,
  Calendar,
  RotateCcw
} from "lucide-react";

interface FilterState {
  search: string;
  businessUnit: string;
  scoreRange: string;
  activityStatus: string;
  sortBy: string;
  sortOrder: string;
}

interface UsersFilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  businessUnits: string[];
  totalUsers: number;
  filteredCount: number;
}

export function UsersFilter({ 
  filters, 
  onFiltersChange, 
  businessUnits, 
  totalUsers, 
  filteredCount 
}: UsersFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      businessUnit: "all",
      scoreRange: "all",
      activityStatus: "all",
      sortBy: "name",
      sortOrder: "asc"
    });
    setShowAdvanced(false);
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value && value !== "all" && value !== "asc" && value !== "name"
  ).length;

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filtros e Busca
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} filtros ativos
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showAdvanced ? "Ocultar" : "Filtros Avançados"}
            </Button>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </div>
        
        {/* Results counter */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Mostrando {filteredCount} de {totalUsers} usuários</span>
          {filteredCount !== totalUsers && (
            <Badge variant="outline" className="text-xs">
              Filtrado
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Bar - Always Visible */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou business unit..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-10"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => updateFilter("search", "")}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Quick Filters Row */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <Select value={filters.businessUnit} onValueChange={(value) => updateFilter("businessUnit", value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Business Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Units</SelectItem>
                {businessUnits.map(unit => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <Select value={filters.activityStatus} onValueChange={(value) => updateFilter("activityStatus", value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos (30 dias)</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t border-border/30 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Score Range Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Faixa de Score
                </Label>
                <Select value={filters.scoreRange} onValueChange={(value) => updateFilter("scoreRange", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar faixa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os scores</SelectItem>
                    <SelectItem value="high">Alto (75-100%)</SelectItem>
                    <SelectItem value="medium">Médio (50-74%)</SelectItem>
                    <SelectItem value="low">Baixo (0-49%)</SelectItem>
                    <SelectItem value="no-score">Sem score</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="w-4 h-4 text-primary" />
                  Ordenar por
                </Label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nome</SelectItem>
                    <SelectItem value="meetings">Número de Reuniões</SelectItem>
                    <SelectItem value="score">Score Médio</SelectItem>
                    <SelectItem value="lastActivity">Última Atividade</SelectItem>
                    <SelectItem value="businessUnit">Business Unit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Ordem</Label>
                <Select value={filters.sortOrder} onValueChange={(value) => updateFilter("sortOrder", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Crescente</SelectItem>
                    <SelectItem value="desc">Decrescente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}