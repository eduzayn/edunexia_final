import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { Loader2, Search, User, X, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import { FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

// Interface para clientes Asaas
interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
}

interface AsaasCustomerSearchProps {
  value: string;
  onChange: (value: string) => void;
  onCustomerSelect: (customer: AsaasCustomer) => void;
  className?: string;
  placeholder?: string;
  description?: string;
  error?: string;
  label?: string;
  isRequired?: boolean;
}

export function AsaasCustomerSearch({
  value,
  onChange,
  onCustomerSelect,
  className,
  placeholder = 'Nome completo do aluno',
  description,
  error,
  label = '',
  isRequired = false,
}: AsaasCustomerSearchProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const debouncedSearch = useDebounce(inputValue, 500);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Buscar clientes Asaas pelo nome
  const { data, isFetching } = useQuery({
    queryKey: ['asaas-customers-search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 3) return { data: [] };
      
      const response = await fetch(`/api-json/crm/asaas-customers-search?name=${encodeURIComponent(debouncedSearch)}`);
      if (!response.ok) throw new Error('Falha ao buscar clientes');
      return response.json();
    },
    enabled: debouncedSearch.length >= 3,
  });
  
  const customers = data?.data || [];
  
  // Atualizar o campo de busca quando o valor externo mudar
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  
  // Função para selecionar um cliente
  const handleCustomerSelect = useCallback((customer: AsaasCustomer) => {
    // Preservar o nome original do cliente
    const customerName = customer.name.trim();
    
    console.log('⚠️ Cliente selecionado de lista existente:', customerName);
    
    // Usar setTimeout para garantir que o React complete seu ciclo de renderização 
    // antes de alterar mais estados - isso ajuda a evitar problemas de DOM em produção
    setTimeout(() => {
      // IMPORTANTE: A ordem aqui é crítica para evitar perdas de estado
      // 1. Fechar o diálogo primeiro para evitar conflitos de DOM
      setOpen(false);
      
      // 2. Atualizar estados após o fechamento do diálogo
      setInputValue(customerName);
      onChange(customerName);
      
      // 3. Notificar o componente pai com as informações do cliente
      onCustomerSelect({
        ...customer,
        name: customerName // Garantir que o nome está corretamente formatado
      });
    }, 0);
  }, [onChange, onCustomerSelect]);
  
  // Função para criar um novo cliente quando nenhum é encontrado
  const handleCreateNewCustomer = useCallback(() => {
    if (debouncedSearch && debouncedSearch.length >= 3) {
      // Preservar o nome exato digitado pelo usuário
      const name = inputValue.trim();
      
      // Criar um cliente fictício com os dados da busca para continuar o fluxo
      const newCustomer: AsaasCustomer = {
        id: 'new_customer_' + Date.now(), // Será substituído quando criar no backend, adicionando timestamp para evitar colisões
        name: name, // Usar o valor exato do input, não o debounced
        email: '', // Serão preenchidos pelo usuário no formulário
        cpfCnpj: '',
      };
      
      console.log('⚠️ Criando novo cliente com nome:', name);
      
      // Notificar o usuário sobre o que está acontecendo
      toast({
        title: "Criando novo cliente",
        description: `Preencha os dados do novo cliente: ${name}`,
      });
      
      // Importante: manter o nome exato digitado pelo usuário em sincronia
      // Este é um ponto crítico onde o nome pode ser substituído se não for feito corretamente
      setInputValue(name); // Garantir que o inputValue está atualizado
      onChange(name);      // Atualizar o valor do campo do formulário
      onCustomerSelect(newCustomer); // Passar o cliente com o nome correto
      setOpen(false);
    }
  }, [debouncedSearch, inputValue, onChange, onCustomerSelect, toast]);
  
  // Função para tratar o pressionamento da tecla Enter no diálogo
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    // Se pressionar Enter quando nenhum cliente foi encontrado e pesquisa tem pelo menos 3 caracteres
    if (e.key === 'Enter' && customers.length === 0 && debouncedSearch.length >= 3 && !isFetching) {
      e.preventDefault();
      handleCreateNewCustomer();
    }
  }, [customers.length, debouncedSearch, handleCreateNewCustomer, isFetching]);
  
  // Função para limpar o campo
  const handleClear = () => {
    setInputValue('');
    onChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  return (
    <div className={className}>
      {label && (
        <Label htmlFor="asaas-customer-search" className="mb-2 block">
          {label}{isRequired && '*'}
        </Label>
      )}
      
      <div className="relative">
        <Input
          ref={inputRef}
          id="asaas-customer-search"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          onKeyDown={(e) => {
            // Se pressionar Enter e o campo tem pelo menos 3 caracteres, abre o diálogo
            if (e.key === 'Enter' && inputValue.length >= 3) {
              e.preventDefault();
              setOpen(true);
            }
          }}
          placeholder={placeholder}
          className="pr-16"
          onFocus={() => setOpen(true)}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
          {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          
          {inputValue && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={handleClear}
              className="h-5 w-5 p-0 text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Limpar</span>
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => setOpen(true)}
            className="h-5 w-5 p-0 text-muted-foreground"
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Buscar cliente</span>
          </Button>
        </div>
      </div>
      
      {description && (
        <FormDescription className="mt-1">{description}</FormDescription>
      )}
      
      {error && (
        <p className="text-sm font-medium text-destructive mt-1">{error}</p>
      )}
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Buscar clientes no Asaas</DialogTitle>
        <CommandInput
          ref={commandInputRef}
          placeholder="Buscar clientes no Asaas..."
          value={inputValue}
          onValueChange={setInputValue}
          onKeyDown={handleKeyDown}
        />
        <CommandList>
          <CommandEmpty>
            {isFetching ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="py-4 flex flex-col items-center justify-center gap-3">
                {debouncedSearch.length < 3 ? (
                  <div className="text-center text-sm">
                    Digite pelo menos 3 caracteres para buscar
                  </div>
                ) : (
                  <>
                    <div className="text-center text-sm">
                      Nenhum cliente encontrado com esse nome
                    </div>
                    <Button 
                      size="sm"
                      onClick={handleCreateNewCustomer}
                      className="mt-2"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Criar novo cliente
                    </Button>
                    <div className="text-xs text-muted-foreground mt-1">
                      Pressione <span className="font-semibold">Enter</span> para criar um novo cliente
                    </div>
                  </>
                )}
              </div>
            )}
          </CommandEmpty>
          
          {customers.length > 0 && (
            <CommandGroup heading="Clientes encontrados">
              {customers.map((customer: AsaasCustomer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.name}
                  onSelect={() => handleCustomerSelect(customer)}
                >
                  <User className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{customer.name}</span>
                    <span className="text-xs text-muted-foreground">
                      CPF: {customer.cpfCnpj} | E-mail: {customer.email}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </div>
  );
}