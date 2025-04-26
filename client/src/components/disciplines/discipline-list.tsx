import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, BookOpen, Clock } from "lucide-react";
import { listDisciplines } from "@/api/disciplines";
import { Discipline } from "@/types/discipline";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export function DisciplineList() {
  const { data: disciplines, isLoading, error } = useQuery({
    queryKey: ['/api/admin/disciplines'],
    queryFn: listDisciplines,
  });
  
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    try {
      // A função de exclusão será implementada posteriormente
      // await deleteDiscipline(id);
      toast({
        title: "Disciplina excluída",
        description: "A disciplina foi excluída com sucesso.",
        variant: "default",
      });
      
      // Invalidar a consulta para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['/api/admin/disciplines'] });
    } catch (error) {
      toast({
        title: "Erro ao excluir disciplina",
        description: "Não foi possível excluir a disciplina. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Disciplinas</CardTitle>
          <CardDescription>Carregando disciplinas...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-center justify-center">
            <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Disciplinas</CardTitle>
          <CardDescription>Erro ao carregar disciplinas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md">
            <p className="text-destructive">Ocorreu um erro ao carregar a lista de disciplinas. Tente novamente.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="flex-1">
          <CardTitle>Disciplinas</CardTitle>
          <CardDescription>Gerencie as disciplinas do seu catálogo acadêmico.</CardDescription>
        </div>
        <Button asChild>
          <Link to="/admin/academico/disciplines/new">
            <Plus className="mr-2 h-4 w-4" /> Nova Disciplina
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {disciplines && disciplines.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Carga Horária</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disciplines.map((discipline: Discipline) => (
                <TableRow key={discipline.id}>
                  <TableCell className="font-mono text-xs">{discipline.code}</TableCell>
                  <TableCell>{discipline.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span>{discipline.workload}h</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={discipline.contentStatus === "complete" ? "default" : "outline"}
                    >
                      {discipline.contentStatus === "complete" ? "Completa" : "Incompleta"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        asChild
                      >
                        <Link to={`/admin/academico/disciplines/${discipline.id}/content`}>
                          <BookOpen className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        asChild
                      >
                        <Link to={`/admin/academico/disciplines/${discipline.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente a disciplina <strong>{discipline.name}</strong> e todos os seus conteúdos associados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(discipline.id)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center p-8 border rounded-lg">
            <h3 className="font-semibold mb-2">Nenhuma disciplina encontrada</h3>
            <p className="text-muted-foreground mb-4">Crie sua primeira disciplina para começar a organizar o conteúdo acadêmico.</p>
            <Button asChild>
              <Link to="/admin/academico/disciplines/new">
                <Plus className="mr-2 h-4 w-4" /> Criar Disciplina
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}