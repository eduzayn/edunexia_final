import React, { useState } from "react";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  SecurityIcon, 
  ShieldIcon, 
  AdminPanelSettingsIcon,
  UsersIcon,
  GroupIcon
} from "@/components/ui/icons";
import { AlertTriangle, RefreshCw, Search, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { BreadcrumbWithBackButton } from "@/components/ui/breadcrumb-with-back-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

// Schema para formulário de permissão
const roleFormSchema = z.object({
  name: z.string().min(3, {
    message: "Nome deve ter pelo menos 3 caracteres",
  }),
  description: z.string().min(3, {
    message: "Descrição deve ter pelo menos 3 caracteres",
  }),
  permissions: z.array(z.string()).optional(),
});

export default function RolesPage() {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Consulta para listar funções
  const { 
    data: roles, 
    isLoading: isLoadingRoles,
    refetch: refetchRoles
  } = useQuery({
    queryKey: ["/api-json/permissions/roles"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api-json/permissions/roles");
      console.log("rolesQuery.data:", await response.json());
      return response.json();
    },
  });

  // Consulta para listar permissões disponíveis
  const { 
    data: permissions,
    isLoading: isLoadingPermissions
  } = useQuery({
    queryKey: ["/api-json/permissions/list"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api-json/permissions/list");
      return response.json();
    },
  });

  // Formulário para edição/criação de função
  const form = useForm<z.infer<typeof roleFormSchema>>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  // Mutation para criar função
  const createRoleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof roleFormSchema>) => {
      const response = await apiRequest("POST", "/api-json/permissions/roles", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Função criada",
        description: "A função foi criada com sucesso.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api-json/permissions/roles"],
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar função",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar função
  const updateRoleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof roleFormSchema>) => {
      const response = await apiRequest("PUT", `/api-json/permissions/roles/${selectedRole.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Função atualizada",
        description: "A função foi atualizada com sucesso.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api-json/permissions/roles"],
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar função",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar função
  const deleteRoleMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api-json/permissions/roles/${selectedRole.id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Função excluída",
        description: "A função foi excluída com sucesso.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api-json/permissions/roles"],
      });
      setIsDeleteDialogOpen(false);
      setSelectedRole(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir função",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handler para submissão do formulário
  const onSubmit = (data: z.infer<typeof roleFormSchema>) => {
    if (isEditMode) {
      updateRoleMutation.mutate(data);
    } else {
      createRoleMutation.mutate(data);
    }
  };

  // Handler para abertura do diálogo em modo edição
  const handleEditRole = (role: any) => {
    setSelectedRole(role);
    setIsEditMode(true);
    form.reset({
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((p: any) => p.id.toString()),
    });
    setIsDialogOpen(true);
  };

  // Handler para abertura do diálogo em modo criação
  const handleAddRole = () => {
    setIsEditMode(false);
    form.reset({
      name: "",
      description: "",
      permissions: [],
    });
    setIsDialogOpen(true);
  };

  // Handler para confirmar exclusão de função
  const handleConfirmDelete = (role: any) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="container px-4 py-6 mx-auto">
        <div className="flex justify-between items-center mb-6">
          <BreadcrumbWithBackButton
            items={[
              { title: "Dashboard", link: "/admin/dashboard" },
              { title: "Administração", link: "/admin" },
              { title: "Sistema", link: "/admin/sistema/settings" },
              { title: "Funções & Permissões", link: "/admin/pessoas/roles" },
            ]}
          />
        </div>

        <div className="flex flex-col space-y-6">
          <div className="flex items-center space-x-2">
            <SecurityIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Funções & Permissões</h1>
          </div>
          
          <div className="text-muted-foreground">
            Gerencie as funções e permissões para acesso ao sistema. Configure quais ações cada tipo de usuário pode realizar.
          </div>

          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Funções do Sistema</h2>
            <Button onClick={handleAddRole}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Função
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableCaption>Lista de funções e permissões do sistema</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Permissões</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!isLoadingRoles && roles?.length > 0 ? (
                      roles.map((role: any) => (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <ShieldIcon className="h-5 w-5 text-primary" />
                              <span>{role.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{role.description}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {role.permissions?.map((permission: any) => (
                                <Badge key={permission.id} variant="outline">
                                  {permission.name}
                                </Badge>
                              ))}
                              {role.permissions?.length === 0 && (
                                <span className="text-sm text-muted-foreground">
                                  Nenhuma permissão atribuída
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditRole(role)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleConfirmDelete(role)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          {isLoadingRoles ? (
                            <div className="flex justify-center items-center">
                              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                              <span className="ml-2">Carregando funções...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <ShieldIcon className="h-8 w-8 text-muted-foreground mb-2" />
                              <span>Nenhuma função encontrada</span>
                              <Button onClick={handleAddRole} className="mt-4" variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar Função
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Alert variant="warning" className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Cuidado ao modificar funções</AlertTitle>
            <AlertDescription>
              Alterações nas funções e permissões afetam diretamente o acesso dos usuários ao sistema. 
              Certifique-se de que você compreende o impacto das alterações.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Diálogo para edição/criação de função */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Editar Função" : "Nova Função"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Modifique os detalhes da função e suas permissões."
                : "Preencha os detalhes para criar uma nova função no sistema."
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Função</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Administrador" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nome que identifica a função no sistema.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Acesso total ao sistema" {...field} />
                    </FormControl>
                    <FormDescription>
                      Breve descrição sobre o propósito desta função.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permissions"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Permissões</FormLabel>
                      <FormDescription>
                        Selecione as permissões que esta função terá no sistema.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto border rounded-md p-4">
                      {isLoadingPermissions ? (
                        <div className="col-span-2 flex justify-center items-center py-4">
                          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                          <span className="ml-2">Carregando permissões...</span>
                        </div>
                      ) : (
                        permissions?.map((permission: any) => (
                          <FormField
                            key={permission.id}
                            control={form.control}
                            name="permissions"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={permission.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(permission.id.toString())}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value || [], permission.id.toString()])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== permission.id.toString()
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    {permission.name}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                >
                  {(createRoleMutation.isPending || updateRoleMutation.isPending) ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? "Salvando..." : "Criando..."}
                    </>
                  ) : (
                    isEditMode ? "Salvar Alterações" : "Criar Função"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para excluir função */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Você está prestes a excluir a função "{selectedRole?.name}". 
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center p-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Atenção!</AlertTitle>
              <AlertDescription>
                Os usuários que possuem esta função perderão as permissões associadas.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteRoleMutation.mutate()}
              disabled={deleteRoleMutation.isPending}
            >
              {deleteRoleMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Confirmar Exclusão
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}