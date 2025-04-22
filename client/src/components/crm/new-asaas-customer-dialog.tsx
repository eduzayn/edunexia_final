import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { AsaasCustomer } from "@/pages/admin/crm/asaas-clients-page";

// Schema para validação dos dados do formulário - simplificado conforme exigências do Asaas
const customerSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpfCnpj: z.string().min(11, "CPF deve ter 11 dígitos").max(14, "CNPJ deve ter 14 dígitos"),
  personType: z.enum(["FISICA", "JURIDICA"]),
  mobilePhone: z.string().optional(),
});

// Tipo derivado do schema
type CustomerFormValues = z.infer<typeof customerSchema>;

// Props para o componente de diálogo
interface NewAsaasCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (customer: AsaasCustomer) => void;
}

// Componente principal do diálogo
export default function NewAsaasCustomerDialog({
  open,
  onOpenChange,
  onSuccess
}: NewAsaasCustomerDialogProps) {
  const { toast } = useToast();
  
  // Configurar o formulário com o validador
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      cpfCnpj: "",
      personType: "FISICA",
      mobilePhone: "",
    },
  });

  // Mutação para criar um novo cliente
  const mutation = useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      const response = await fetch('/api/debug/asaas-customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao criar cliente");
      }
      
      return await response.json();
    },
    onSuccess: (response) => {
      // Invalidar a consulta para atualizar a lista de clientes
      queryClient.invalidateQueries({ queryKey: ['/api/debug/asaas-customers'] });
      
      // Mostrar notificação de sucesso
      toast({
        title: "Cliente criado com sucesso",
        description: `${response.data.name} foi adicionado ao Asaas.`,
      });
      
      // Fechar o diálogo
      onOpenChange(false);
      
      // Limpar o formulário
      form.reset();
      
      // Callback opcional
      if (onSuccess) {
        onSuccess(response.data);
      }
    },
    onError: (error: Error) => {
      // Mostrar notificação de erro
      toast({
        title: "Erro ao criar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Manipulador para envio do formulário
  const onSubmit = (data: CustomerFormValues) => {
    // Remover caracteres não numéricos do CPF/CNPJ e telefone
    const formattedData = {
      ...data,
      cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
      mobilePhone: data.mobilePhone ? data.mobilePhone.replace(/\D/g, '') : undefined,
    };
    
    mutation.mutate(formattedData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar cliente</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para adicionar o seu cliente.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="personType"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Tipo de Pessoa</FormLabel>
                  <FormControl>
                    <RadioGroup
                      defaultValue={field.value}
                      className="flex space-x-4"
                      onValueChange={field.onChange}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="FISICA" id="fisica" />
                        <Label htmlFor="fisica">Pessoa Física</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="JURIDICA" id="juridica" />
                        <Label htmlFor="juridica">Pessoa Jurídica</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Informe o nome do cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cpfCnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {form.watch("personType") === "FISICA" ? "CPF" : "CNPJ"} (Opcional)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={`Informe o ${form.watch("personType") === "FISICA" ? "CPF" : "CNPJ"} do cliente`} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Informe o email do cliente" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="mobilePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adicionando...
                  </>
                ) : (
                  "Adicionar cliente"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}