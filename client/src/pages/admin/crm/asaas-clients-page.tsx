import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AdminLayout from "@/components/layout/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { 
  UserIcon, 
  SearchIcon, 
  FilterIcon,
  EyeIcon,
  MailIcon,
  PhoneIcon,
  Building2Icon,
  IdCardIcon
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Interface for Asaas customer
interface AsaasCustomer {
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

export default function AsaasClientsPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch clients from the Asaas API
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/debug/asaas-customers", searchTerm],
    queryFn: async () => {
      const url = searchTerm
        ? `/api/debug/asaas-customers?search=${encodeURIComponent(searchTerm)}`
        : '/api/debug/asaas-customers';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Falha ao carregar clientes do Asaas');
      }
      return response.json();
    },
    refetchOnWindowFocus: false
  });
  
  const customers: AsaasCustomer[] = data?.data || [];

  // Format CPF/CNPJ for display
  const formatDocument = (doc: string) => {
    if (!doc) return '';
    
    // CPF: 123.456.789-01
    if (doc.length === 11) {
      return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    
    // CNPJ: 12.345.678/0001-90
    if (doc.length === 14) {
      return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    
    return doc;
  };

  // Get badge for person type
  const getPersonTypeBadge = (type: string) => {
    if (type === "FISICA") {
      return <Badge className="bg-blue-500">Pessoa Física</Badge>;
    }
    if (type === "JURIDICA") {
      return <Badge className="bg-purple-500">Pessoa Jurídica</Badge>;
    }
    return <Badge>{type}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes Asaas</h1>
            <p className="text-gray-500">
              Gerenciamento de clientes integrados com Asaas.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Listagem de Clientes Asaas</CardTitle>
            <CardDescription>
              Visualize todos os clientes cadastrados na plataforma de pagamentos Asaas.
            </CardDescription>
            <div className="flex items-center space-x-2 pt-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar por nome, email ou CPF/CNPJ..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <FilterIcon className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              // Loading state
              <div className="space-y-2">
                {Array(5)
                  .fill(null)
                  .map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
              </div>
            ) : error ? (
              // Error state
              <div className="p-6 text-center">
                <p className="text-red-500">Erro ao carregar clientes do Asaas.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Verifique a conexão com a API Asaas e tente novamente.
                </p>
              </div>
            ) : (
              // Data table
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead className="text-right">ID Asaas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                        Nenhum cliente encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <UserIcon className="mr-2 h-4 w-4" />
                            {customer.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <IdCardIcon className="mr-2 h-4 w-4 text-gray-500" />
                            {formatDocument(customer.cpfCnpj)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MailIcon className="mr-2 h-4 w-4 text-gray-500" />
                            {customer.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <PhoneIcon className="mr-2 h-4 w-4 text-gray-500" />
                            {customer.mobilePhone || customer.phone || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPersonTypeBadge(customer.personType)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Building2Icon className="mr-2 h-4 w-4 text-gray-500" />
                            {customer.cityName && customer.state 
                              ? `${customer.cityName}/${customer.state}` 
                              : customer.state || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {customer.id}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}