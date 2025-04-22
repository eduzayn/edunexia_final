import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCcw, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/layout/admin-layout";
import { useToast } from "@/hooks/use-toast";


// Define a interface para clientes do Asaas
export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  personType: "FISICA" | "JURIDICA";
  mobilePhone?: string;
  phone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: number;
  cityName?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  externalReference?: string;
}

// Componente principal da página de clientes Asaas
export default function AsaasClientsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const itemsPerPage = 10;

  // Consulta para buscar clientes Asaas
  const {
    data: clientsData,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['/api/debug/asaas-customers', searchTerm],
    queryFn: async () => {
      console.log("Buscando clientes Asaas...");
      const endpoint = searchTerm 
        ? `/api/debug/asaas-customers?search=${encodeURIComponent(searchTerm)}`
        : '/api/debug/asaas-customers';
        
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao carregar clientes Asaas");
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Erro no processamento da requisição");
      }
      
      return data.data || [];
    },
    enabled: true,
  });

  // Função para lidar com erro de carregamento
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/debug/asaas-customers'] });
    refetch();
    toast({
      title: "Atualizando dados",
      description: "Buscando dados atualizados dos clientes Asaas."
    });
  };

  // Função para realizar a pesquisa
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setCurrentPage(1);
    refetch().finally(() => setIsSearching(false));
  };

  // Calcular paginação
  const clients = clientsData || [];
  const totalPages = Math.ceil(clients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClients = clients.slice(startIndex, endIndex);

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Clientes Asaas</h1>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Atualizando...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" /> Atualizar
              </>
            )}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Clientes registrados no Asaas</CardTitle>
            <CardDescription>
              Lista de clientes sincronizados com a plataforma Asaas para processamento de pagamentos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
              <Input
                placeholder="Buscar por nome, e-mail ou CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isSearching || isLoading}>
                {isSearching ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Buscando
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" /> Buscar
                  </>
                )}
              </Button>
            </form>

            {isError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md my-4">
                <h3 className="font-semibold mb-2">Erro ao carregar clientes</h3>
                <p>Ocorreu um erro ao tentar carregar os clientes do Asaas. Por favor, tente novamente.</p>
                <Button 
                  variant="outline" 
                  className="mt-2" 
                  onClick={handleRefresh} 
                  size="sm"
                >
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF/CNPJ</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>ID Asaas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        Array(5).fill(0).map((_, index) => (
                          <TableRow key={`skeleton-${index}`}>
                            <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          </TableRow>
                        ))
                      ) : currentClients.length > 0 ? (
                        currentClients.map((client: AsaasCustomer) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell>{client.cpfCnpj}</TableCell>
                            <TableCell>{client.email}</TableCell>
                            <TableCell>{client.mobilePhone || client.phone || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={client.personType === "FISICA" ? "outline" : "secondary"}>
                                {client.personType === "FISICA" ? "Pessoa Física" : "Pessoa Jurídica"}
                              </Badge>
                            </TableCell>
                            <TableCell>{client.state || "-"}</TableCell>
                            <TableCell>
                              <span className="text-xs text-gray-500 font-mono">{client.id}</span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            {searchTerm ? (
                              <div className="text-gray-500">
                                <p>Nenhum cliente encontrado para "{searchTerm}"</p>
                                <p className="text-sm mt-1">Tente usar um termo diferente ou limpar a busca</p>
                              </div>
                            ) : (
                              <div className="text-gray-500">
                                <p>Nenhum cliente encontrado</p>
                                <p className="text-sm mt-1">Não há clientes cadastrados no Asaas ainda</p>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação */}
                {!isLoading && clients.length > itemsPerPage && (
                  <div className="mt-4 flex justify-center">
                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-md ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                      >
                        Anterior
                      </button>
                      
                      {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                        let pageNumber;
                        
                        // Lógica para mostrar páginas relevantes quando há muitas
                        if (totalPages <= 5) {
                          pageNumber = index + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = index + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + index;
                        } else {
                          pageNumber = currentPage - 2 + index;
                        }
                        
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`w-9 h-9 rounded-md ${
                              currentPage === pageNumber 
                                ? 'bg-primary text-white' 
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-md ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                      >
                        Próxima
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}