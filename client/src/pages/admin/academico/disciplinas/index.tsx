import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Book, Edit, Trash2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function DisciplinasPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewDisciplineDialogOpen, setIsNewDisciplineDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [disciplineToDelete, setDisciplineToDelete] = useState<any>(null);
  const [formState, setFormState] = useState({
    name: "",
    description: "",
    workload: "30",
    syllabus: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Consulta para buscar todas as disciplinas
  const { 
    data: disciplines,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["/api/admin/disciplines"],
  });

  // Filtrar disciplinas com base na busca
  const filteredDisciplines = disciplines?.filter((discipline: any) => {
    // Se não houver busca, retorna todas as disciplinas
    if (!searchQuery.trim()) return true;
    
    // Busca case-insensitive nos campos relevantes
    const query = searchQuery.toLowerCase();
    return (
      discipline.name?.toLowerCase().includes(query) ||
      discipline.code?.toLowerCase().includes(query) ||
      discipline.description?.toLowerCase().includes(query)
    );
  });

  // Funções para manipular os modais
  const openNewDisciplineDialog = () => {
    setFormState({
      name: "",
      description: "",
      workload: "30",
      syllabus: ""
    });
    setIsNewDisciplineDialogOpen(true);
  };

  const closeNewDisciplineDialog = () => {
    setIsNewDisciplineDialogOpen(false);
  };

  const openDeleteDialog = (discipline: any) => {
    setDisciplineToDelete(discipline);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDisciplineToDelete(null);
  };

  // Função para criar nova disciplina
  const handleCreateDiscipline = async () => {
    try {
      setIsSubmitting(true);

      // Validar campos
      if (!formState.name || !formState.description || !formState.workload || !formState.syllabus) {
        toast({
          title: "Campos incompletos",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Enviar para API
      const response = await apiRequest('/api/admin/disciplines', {
        method: 'POST',
        data: {
          name: formState.name,
          description: formState.description,
          workload: parseInt(formState.workload),
          syllabus: formState.syllabus
        }
      });

      // Atualizar cache do React Query
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/disciplines'] });
      
      toast({
        title: "Disciplina criada",
        description: "A disciplina foi criada com sucesso"
      });

      // Fechar modal
      closeNewDisciplineDialog();
      
    } catch (error) {
      console.error("Erro ao criar disciplina:", error);
      toast({
        title: "Erro ao criar disciplina",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para excluir disciplina
  const handleDeleteDiscipline = async () => {
    if (!disciplineToDelete) return;
    
    try {
      setIsSubmitting(true);
      
      // Enviar para API
      await apiRequest(`/api/admin/disciplines/${disciplineToDelete.id}`, {
        method: 'DELETE'
      });

      // Atualizar cache do React Query
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/disciplines'] });
      
      toast({
        title: "Disciplina excluída",
        description: "A disciplina foi excluída com sucesso"
      });

      // Fechar modal
      closeDeleteDialog();
      
    } catch (error) {
      console.error("Erro ao excluir disciplina:", error);
      toast({
        title: "Erro ao excluir disciplina",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navegar para a página de conteúdo da disciplina
  const handleManageContent = (disciplineId: number | string) => {
    navigate(`/admin/academico/disciplinas/${disciplineId}/content`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Disciplinas</h1>
          <p className="text-gray-500">Gerencie as disciplinas do sistema</p>
        </div>
        
        <div className="flex gap-2">
          <Input 
            placeholder="Buscar disciplinas..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Button onClick={openNewDisciplineDialog}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nova Disciplina
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listagem de Disciplinas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredDisciplines && filteredDisciplines.length > 0 ? (
            <div className="overflow-x-auto">
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
                  {filteredDisciplines.map((discipline: any) => (
                    <TableRow key={discipline.id}>
                      <TableCell className="font-medium">{discipline.code}</TableCell>
                      <TableCell>{discipline.name}</TableCell>
                      <TableCell>{discipline.workload}h</TableCell>
                      <TableCell>
                        {discipline.contentStatus === 'complete' ? (
                          <Badge variant="default" className="bg-green-500">Completa</Badge>
                        ) : discipline.contentStatus === 'pending' ? (
                          <Badge variant="outline" className="text-amber-500 border-amber-500">Em progresso</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">Incompleta</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleManageContent(discipline.id)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Conteúdo
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openDeleteDialog(discipline)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10">
              <Book className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">Nenhuma disciplina encontrada</h3>
              <p className="text-gray-500 mt-1">
                {searchQuery 
                  ? "Tente ajustar os termos da busca" 
                  : "Clique em 'Nova Disciplina' para adicionar uma disciplina"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para criar nova disciplina */}
      <Dialog open={isNewDisciplineDialogOpen} onOpenChange={setIsNewDisciplineDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Disciplina</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para criar uma nova disciplina.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Disciplina</Label>
              <Input
                id="name"
                placeholder="Ex: Didática do Ensino Superior"
                value={formState.name}
                onChange={(e) => setFormState({...formState, name: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Breve descrição da disciplina..."
                value={formState.description}
                onChange={(e) => setFormState({...formState, description: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="workload">Carga Horária (horas)</Label>
              <Input
                id="workload"
                placeholder="Ex: 30"
                value={formState.workload}
                onChange={(e) => setFormState({...formState, workload: e.target.value})}
                type="number"
                min="1"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="syllabus">Ementa da Disciplina</Label>
              <Textarea
                id="syllabus"
                placeholder="Conteúdo programático da disciplina..."
                value={formState.syllabus}
                onChange={(e) => setFormState({...formState, syllabus: e.target.value})}
                rows={5}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline" 
              onClick={closeNewDisciplineDialog}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateDiscipline}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar Disciplina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para confirmar exclusão de disciplina */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Você está prestes a excluir a disciplina{" "}
              <span className="font-semibold text-black">
                {disciplineToDelete?.name}
              </span>
              . Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline" 
              onClick={closeDeleteDialog}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleDeleteDiscipline}
              disabled={isSubmitting}
              variant="destructive"
            >
              {isSubmitting ? "Excluindo..." : "Excluir Disciplina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}