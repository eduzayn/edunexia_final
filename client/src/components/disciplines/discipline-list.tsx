import React, { useState, useEffect } from "react";
import { useRouter } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash, 
  BookOpen, 
  CheckCircle, 
  AlertCircle, 
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/api-request";

interface Discipline {
  id: number;
  code: string;
  name: string;
  workload: number;
  description: string;
  contentStatus: 'complete' | 'incomplete';
}

export function DisciplineList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [disciplineToDelete, setDisciplineToDelete] = useState<Discipline | null>(null);
  const [location, navigate] = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch disciplines
  const { 
    data: disciplines = [], 
    isLoading, 
    error 
  } = useQuery<Discipline[]>({
    queryKey: ['/api/disciplinas'],
    queryFn: async () => {
      const response = await apiRequest('/api/disciplinas');
      return response.data || [];
    }
  });
  
  // Delete discipline mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/disciplinas/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Disciplina excluída",
        description: "A disciplina foi excluída com sucesso.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/disciplinas'] });
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

  // Filter disciplines based on search term
  const filteredDisciplines = disciplines.filter(discipline => 
    discipline.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    discipline.code.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div>
      <div className="flex justify-between mb-6">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar disciplinas..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          onClick={() => navigate("/admin/academico/disciplines/new")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Nova Disciplina
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Disciplinas</CardTitle>
          <CardDescription>
            {isLoading 
              ? "Carregando disciplinas..." 
              : filteredDisciplines.length === 0 && searchTerm
                ? "Nenhuma disciplina encontrada para a busca."
                : filteredDisciplines.length === 0
                  ? "Nenhuma disciplina cadastrada." 
                  : `Mostrando ${filteredDisciplines.length} disciplina(s).`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <div className="py-8 text-center text-muted-foreground">
              <AlertCircle className="mx-auto h-8 w-8 mb-2" />
              <p>Erro ao carregar disciplinas.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/disciplinas'] })}
              >
                Tentar novamente
              </Button>
            </div>
          ) : filteredDisciplines.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchTerm ? (
                <>
                  <p>Nenhuma disciplina encontrada para a busca "{searchTerm}".</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setSearchTerm("")}
                  >
                    Limpar busca
                  </Button>
                </>
              ) : (
                <>
                  <p>Nenhuma disciplina cadastrada.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate("/admin/academico/disciplines/new")}
                  >
                    Criar primeira disciplina
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Carga Horária</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[160px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisciplines.map((discipline) => (
                    <TableRow key={discipline.id}>
                      <TableCell className="font-medium">{discipline.code}</TableCell>
                      <TableCell>{discipline.name}</TableCell>
                      <TableCell>{discipline.workload}h</TableCell>
                      <TableCell>
                        {discipline.contentStatus === 'complete' ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="mr-1 h-3 w-3" /> Completo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            <AlertCircle className="mr-1 h-3 w-3" /> Incompleto
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/academico/disciplines/${discipline.id}/content`)}
                            title="Gerenciar conteúdo"
                          >
                            <BookOpen className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/academico/disciplines/${discipline.id}/edit`)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDiscipline(discipline)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Excluir"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog 
        open={!!disciplineToDelete} 
        onOpenChange={(open) => !open && setDisciplineToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir disciplina</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a disciplina{" "}
              <span className="font-medium">{disciplineToDelete?.name}</span>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteDiscipline} 
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}