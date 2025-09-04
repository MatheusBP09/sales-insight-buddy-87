import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MeetingsFilterProps {
  onFilterChange: (filters: {
    search: string;
    dateRange: string;
    sentiment: string;
    scoreRange: string;
    company: string;
  }) => void;
  companies: string[];
}

export const MeetingsFilter = ({ onFilterChange, companies }: MeetingsFilterProps) => {
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [sentiment, setSentiment] = useState("all");
  const [scoreRange, setScoreRange] = useState("all");
  const [company, setCompany] = useState("all");

  const applyFilters = () => {
    onFilterChange({
      search,
      dateRange,
      sentiment,
      scoreRange,
      company
    });
  };

  const clearFilters = () => {
    setSearch("");
    setDateRange("all");
    setSentiment("all");
    setScoreRange("all");
    setCompany("all");
    onFilterChange({
      search: "",
      dateRange: "all",
      sentiment: "all",
      scoreRange: "all",
      company: "all"
    });
  };

  const hasActiveFilters = search || dateRange !== "all" || sentiment !== "all" || scoreRange !== "all" || company !== "all";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros de Reuniões
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Título ou empresa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Período</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sentiment */}
          <div className="space-y-2">
            <Label>Sentimento</Label>
            <Select value={sentiment} onValueChange={setSentiment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="positive">Positivo</SelectItem>
                <SelectItem value="neutral">Neutro</SelectItem>
                <SelectItem value="negative">Negativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Score Range */}
          <div className="space-y-2">
            <Label>Score de Interesse</Label>
            <Select value={scoreRange} onValueChange={setScoreRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="high">Alto (75-100%)</SelectItem>
                <SelectItem value="medium">Médio (50-74%)</SelectItem>
                <SelectItem value="low">Baixo (0-49%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label>Empresa</Label>
            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {companies.map((comp) => (
                  <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {hasActiveFilters && (
              <>
                {search && <Badge variant="secondary">Busca: {search}</Badge>}
                {dateRange !== "all" && <Badge variant="secondary">Período: {dateRange}</Badge>}
                {sentiment !== "all" && <Badge variant="secondary">Sentimento: {sentiment}</Badge>}
                {scoreRange !== "all" && <Badge variant="secondary">Score: {scoreRange}</Badge>}
                {company !== "all" && <Badge variant="secondary">Empresa: {company}</Badge>}
              </>
            )}
          </div>
          <Button onClick={applyFilters} size="sm">
            Aplicar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};