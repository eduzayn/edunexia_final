import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Search, User, X } from 'lucide-react';
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
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import { FormDescription } from '@/components/ui/form';

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
  label = 'Nome Completo',
  isRequired = false,
}: AsaasCustomerSearchProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const debouncedSearch = useDebounce(inputValue, 500);
  const inputRef = useRef<HTMLInputElement>(null);
  
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
    onChange(customer.name);
    onCustomerSelect(customer);
    setOpen(false);
  }, [onChange, onCustomerSelect]);
  
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
        <CommandInput
          placeholder="Buscar clientes no Asaas..."
          value={inputValue}
          onValueChange={setInputValue}
        />
        <CommandList>
          <CommandEmpty>
            {isFetching ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="py-6 text-center text-sm">
                {debouncedSearch.length < 3 ? 
                  'Digite pelo menos 3 caracteres para buscar' : 
                  'Nenhum cliente encontrado. Continue digitando para criar um novo.'}
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