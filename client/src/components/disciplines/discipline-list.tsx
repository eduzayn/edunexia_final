import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { disciplinesService } from "@/services/disciplinesService";
import { Discipline } from "@shared/schema";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { SearchIcon, PlusIcon, MoreHorizontal, Pencil, Trash, BookOpen, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export function DisciplineList() {
  // Estado para busca
  const [searchTerm, setSearchTerm] = useState("");
  const [disciplineToDelete, setDisciplineToDelete] = useState<Discipline | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();

  // Consulta para buscar disciplinas
  const { 
    data: disciplines = [], 
    isLoading,
    error
  } = useQuery({
    queryKey: ["/api/admin/disciplines"],
    queryFn: async () => {
      const response = await disciplinesService.getAllDisciplines();
      return response || [];
    }
  });

  // Delete discipline mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return disciplinesService.deleteDiscipline(id);
    },
    onSuccess: () => {
      toast({
        title: "Disciplina excluída",
        description: "A disciplina foi excluída com sucesso.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/disciplines"] });
      setDisciplineToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir disciplina",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir a disciplina.",
        variant: "destructive",
      });
    }
  });

  // Filtrar disciplinas com base na busca
  const filteredDisciplines = disciplines.filter(discipline => 
    discipline.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    discipline.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (discipline.description &&
      discipline.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle delete discipline
  const handleDeleteDiscipline = (discipline: Discipline) => {
    setDisciplineToDelete(discipline);
  };

  // Confirm delete discipline
  const confirmDeleteDiscipline = () => {
    if (disciplineToDelete) {
      deleteMutation.mutate(disciplineToDelete.id);
    }
  };

  // Renderizar o status de uma disciplina
  const renderContentStatus = (status: string) => {
    switch (status) {
      case "complete":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" /> Completo
          </Badge>
        );
      case "incomplete":
        return (
          <Badge variant="outline">
            <AlertCircle className="mr-1 h-3 w-3" /> Incompleto
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar disciplina..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link href="/admin/academic/disciplines/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Nova Disciplina
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Disciplinas</CardTitle>
          <CardDescription>
            {isLoading 
              ? "Carregando disciplinas..." 
              : filteredDisciplines.length === 0 && searchTerm
                ? "Nenhuma disciplina encontrada para a busca."
                : filteredDisciplines.length === 0
                  ? "Nenhuma disciplina cadastrada." 
                  : `Lista de disciplinas disponíveis na plataforma.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="flex flex-col items-center">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Carregando disciplinas...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 p-4 rounded-md">
              <p className="text-destructive">
                Erro ao carregar disciplinas. Tente novamente mais tarde.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/disciplines'] })}
              >
                Tentar novamente
              </Button>
            </div>
          ) : filteredDisciplines.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Nenhuma disciplina encontrada com os critérios de busca."
                  : "Nenhuma disciplina cadastrada."}
              </p>
              {searchTerm ? (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSearchTerm("")}
                >
                  Limpar busca
                </Button>
              ) : (
                <Link href="/admin/academic/disciplines/new">
                  <Button 
                    variant="outline" 
                    className="mt-4"
                  >
                    Criar primeira disciplina
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Carga Horária</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisciplines.map((discipline) => (
                    <TableRow key={discipline.id}>
                      <TableCell className="font-medium">
                        {discipline.code}
                      </TableCell>
                      <TableCell>{discipline.name}</TableCell>
                      <TableCell>
                        {discipline.workload ? `${discipline.workload}h` : "N/A"}
                      </TableCell>
                      <TableCell>
                        {renderContentStatus(discipline.contentStatus || "incomplete")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/academic/disciplines/${discipline.id}/content`}>
                                <BookOpen className="mr-2 h-4 w-4" />
                                <span>Gerenciar Conteúdo</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/academic/disciplines/${discipline.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Editar</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => {
                                e.preventDefault();
                                handleDeleteDiscipline(discipline);
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Excluir</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!disciplineToDelete} onOpenChange={(open) => !open && setDisciplineToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá excluir permanentemente a disciplina "{disciplineToDelete?.name}" e todo o seu conteúdo.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteDiscipline}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Sim, excluir disciplina"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}