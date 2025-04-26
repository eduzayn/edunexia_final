import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { getAllDisciplines, deleteDiscipline } from "@/api/disciplines";
import { Discipline } from "@shared/schema";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/alert-dialog";
import { AlertCircle, FileText, Pencil, Plus, Search, Trash2, Video } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { queryClient } from "@/lib/queryClient";

export function DisciplineList() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [disciplineToDelete, setDisciplineToDelete] = useState<Discipline | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Busca todas as disciplinas
  const { data: disciplines, isLoading, error } = useQuery({
    queryKey: ["/api/admin/disciplines"],
    queryFn: getAllDisciplines,
  });

  // Função para filtrar disciplinas com base no termo de pesquisa
  const filteredDisciplines = disciplines?.filter(
    (discipline) =>
      discipline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discipline.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discipline.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para lidar com a exclusão de uma disciplina
  const handleDeleteDiscipline = async () => {
    if (!disciplineToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteDiscipline(disciplineToDelete.id.toString());
      
      // Invalida o cache para recarregar a lista
      queryClient.invalidateQueries({ queryKey: ["/api/admin/disciplines"] });
      
      toast({
        title: "Disciplina excluída",
        description: `A disciplina "${disciplineToDelete.name}" foi excluída com sucesso.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao excluir disciplina:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir a disciplina. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDisciplineToDelete(null);
    }
  };

  // Renderiza estado de carregamento
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-sm text-muted-foreground">Carregando disciplinas...</p>
        </div>
      </div>
    );
  }

  // Renderiza estado de erro
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>
          Ocorreu um erro ao carregar as disciplinas. Tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    );
  }

  // Função para verificar se a disciplina tem conteúdo
  const hasContent = (discipline: Discipline) => {
    return Boolean(
      discipline.videoAula1Url || 
      discipline.videoAula2Url || 
      discipline.videoAula3Url || 
      discipline.apostilaUrl || 
      discipline.ebookInterativoUrl
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar disciplinas..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Link href="/admin/academico/disciplines/new">
          <Button className="ml-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Disciplina
          </Button>
        </Link>
      </div>
      
      {filteredDisciplines?.length === 0 ? (
        <div className="text-center p-6 border rounded-md bg-muted/10">
          <p className="text-muted-foreground">
            {searchTerm
              ? "Nenhuma disciplina encontrada com o termo pesquisado."
              : "Nenhuma disciplina cadastrada. Clique em 'Nova Disciplina' para começar."}
          </p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Carga Horária</TableHead>
                <TableHead>Conteúdo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDisciplines?.map((discipline) => (
                <TableRow key={discipline.id}>
                  <TableCell className="font-medium">{discipline.code}</TableCell>
                  <TableCell>{discipline.name}</TableCell>
                  <TableCell>{discipline.workload}h</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {discipline.videoAula1Url && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100">
                          <Video className="h-3 w-3 mr-1" />
                          Vídeos
                        </Badge>
                      )}
                      {discipline.ebookInterativoUrl && (
                        <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-100">
                          <FileText className="h-3 w-3 mr-1" />
                          E-book
                        </Badge>
                      )}
                      {!hasContent(discipline) && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-600 hover:bg-orange-100">
                          Sem conteúdo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link href={`/admin/academico/disciplines/${discipline.id}/edit`}>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                    </Link>
                    <Link href={`/admin/academico/disciplines/${discipline.id}/content`}>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">Conteúdo</span>
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                      onClick={() => {
                        setDisciplineToDelete(discipline);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a disciplina "{disciplineToDelete?.name}"?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteDiscipline();
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  Excluindo...
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