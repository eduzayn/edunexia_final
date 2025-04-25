/**
 * Versão segura do componente AsaasCustomerSearch
 * 
 * Esta é uma reimplementação completa usando um modelo de modal nativo HTML
 * que evita o uso dos componentes que causam problemas de DOM.
 */
import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { Loader2, Search, User, X, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';

// Interface para clientes Asaas
interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
}

interface SafeAsaasCustomerSearchProps {
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

export function SafeAsaasCustomerSearch({
  value,
  onChange,
  onCustomerSelect,
  className,
  placeholder = 'Nome completo do aluno',
  description,
  error,
  label = '',
  isRequired = false,
}: SafeAsaasCustomerSearchProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const debouncedSearch = useDebounce(inputValue, 500);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Estado para rastrear se o componente está montado
  const mountedRef = useRef(true);
  
  // Efeito para limpar referência de montagem ao desmontar
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
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
    if (mountedRef.current) {
      setInputValue(value);
    }
  }, [value]);
  
  // Função para abrir modal
  const openModal = useCallback(() => {
    if (!mountedRef.current) return;
    
    setOpen(true);
    
    // Focar o campo de busca quando o modal abrir
    setTimeout(() => {
      if (searchInputRef.current && mountedRef.current) {
        searchInputRef.current.focus();
      }
    }, 50);
    
    // Adicionar handler para Escape fechar o modal
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    
    // Adicionar listener
    document.addEventListener('keydown', handleEscapeKey as any);
    
    // Limpar listener ao fechar
    return () => {
      document.removeEventListener('keydown', handleEscapeKey as any);
    };
  }, []);
  
  // Função para fechar modal
  const closeModal = useCallback(() => {
    if (!mountedRef.current) return;
    setOpen(false);
  }, []);
  
  // Função para selecionar um cliente
  const handleCustomerSelect = useCallback((customer: AsaasCustomer) => {
    if (!mountedRef.current) return;
    
    // Preservar o nome original do cliente
    const customerName = customer.name.trim();
    
    console.log('⚠️ Cliente selecionado de lista existente:', customerName);
    
    // Evitar manipulações do DOM - fechar modal
    closeModal();
    
    // Atualizar valores com atraso para garantir que o DOM esteja estável
    setTimeout(() => {
      if (!mountedRef.current) return;
      
      // Atualizar valores de forma segura
      setInputValue(customerName);
      onChange(customerName);
      
      // Chamar callback após garantir que o DOM foi atualizado
      setTimeout(() => {
        if (!mountedRef.current) return;
        
        onCustomerSelect({
          ...customer,
          name: customerName // Garantir que o nome está corretamente formatado
        });
      }, 50);
    }, 50);
  }, [onChange, onCustomerSelect, closeModal]);
  
  // Função para criar um novo cliente quando nenhum é encontrado
  const handleCreateNewCustomer = useCallback(() => {
    if (!mountedRef.current) return;
    
    if (debouncedSearch && debouncedSearch.length >= 3) {
      // Preservar o nome exato digitado pelo usuário
      const name = inputValue.trim();
      
      // Criar um cliente fictício com os dados da busca para continuar o fluxo
      const newCustomer: AsaasCustomer = {
        id: 'new_customer_' + Date.now(), // Será substituído quando criar no backend
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
      
      // Fechar modal 
      closeModal();
      
      // Atualizar valores com atraso para garantir que o DOM esteja estável
      setTimeout(() => {
        if (!mountedRef.current) return;
        
        // Atualizar valores de forma segura
        setInputValue(name);
        onChange(name);
        
        // Chamar callback após garantir que o DOM foi atualizado
        setTimeout(() => {
          if (!mountedRef.current) return;
          
          console.log('🔄 Enviando novo cliente para o componente pai:', name);
          onCustomerSelect(newCustomer); // Passar o cliente com o nome correto
          
          // Focar o campo principal para melhorar UX
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 50);
      }, 50);
    }
  }, [debouncedSearch, inputValue, onChange, onCustomerSelect, toast, closeModal]);
  
  // Função para limpar o campo
  const handleClear = () => {
    if (!mountedRef.current) return;
    
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
            if (!mountedRef.current) return;
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          onKeyDown={(e) => {
            // Se pressionar Enter e o campo tem pelo menos 3 caracteres, abre o modal
            if (e.key === 'Enter' && inputValue.length >= 3) {
              e.preventDefault();
              openModal();
            }
          }}
          placeholder={placeholder}
          className="pr-16"
          onFocus={() => openModal()}
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
            onClick={openModal}
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
      
      {/* Modal personalizado em vez de CommandDialog */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-16 z-50">
          <div 
            ref={modalRef}
            className="bg-white rounded-lg shadow-xl w-full max-w-md p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Buscar clientes no Asaas</h2>
              <Button 
                variant="ghost"
                size="sm"
                onClick={closeModal}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            </div>
            
            <div className="mb-4">
              <Input
                ref={searchInputRef}
                placeholder="Buscar clientes no Asaas..."
                value={inputValue}
                onChange={(e) => {
                  if (!mountedRef.current) return;
                  setInputValue(e.target.value);
                }}
                onKeyDown={(e) => {
                  // Se pressionar Enter quando nenhum cliente foi encontrado e a busca tem pelo menos 3 caracteres
                  if (e.key === 'Enter' && customers.length === 0 && debouncedSearch.length >= 3 && !isFetching) {
                    e.preventDefault();
                    handleCreateNewCustomer();
                  }
                }}
                className="w-full"
              />
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
              {isFetching ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : customers.length === 0 ? (
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
              ) : (
                <div className="space-y-1">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Clientes encontrados
                  </div>
                  {customers.map((customer: AsaasCustomer) => (
                    <button
                      key={customer.id}
                      className="w-full text-left px-2 py-2 hover:bg-accent hover:text-accent-foreground rounded-sm"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <div className="flex items-start">
                        <User className="mr-2 h-4 w-4 mt-0.5 shrink-0" />
                        <div className="flex flex-col">
                          <span>{customer.name}</span>
                          <span className="text-xs text-muted-foreground">
                            CPF: {customer.cpfCnpj} | E-mail: {customer.email}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}