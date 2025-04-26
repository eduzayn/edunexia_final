import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, FileText, Search, Edit, Pencil, BookOpen } from "lucide-react";
import { getDisciplines } from "@/api/disciplines";
import { Discipline } from "@shared/schema";

export function DisciplineList() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: disciplines, isLoading, error } = useQuery({
    queryKey: ['/api/admin/disciplines'],
    queryFn: getDisciplines
  });

  // Filtra as disciplinas com base no termo de busca
  const filteredDisciplines = disciplines?.filter((discipline) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      discipline.name.toLowerCase().includes(searchLower) ||
      discipline.code.toLowerCase().includes(searchLower) ||
      discipline.description.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Disciplinas</CardTitle>
          <CardDescription>
            Gerencie as disciplinas oferecidas pela instituição.
          </CardDescription>
        </div>
        <Link href="/admin/academico/disciplines/new">
          <Button className="ml-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Disciplina
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome, código ou descrição..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-sm text-muted-foreground">Carregando disciplinas...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-500 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium">Erro ao carregar disciplinas</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Ocorreu um erro ao buscar as disciplinas. Tente novamente mais tarde.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </div>
          </div>
        ) : disciplines && disciplines.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-500 mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium">Nenhuma disciplina encontrada</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Ainda não há disciplinas cadastradas. Clique no botão acima para criar uma nova.
              </p>
              <Link href="/admin/academico/disciplines/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Disciplina
                </Button>
              </Link>
            </div>
          </div>
        ) : filteredDisciplines && filteredDisciplines.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium">Nenhum resultado encontrado</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Não encontramos disciplinas com o termo "{searchTerm}". Tente outra busca.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDisciplines?.map((discipline: Discipline) => (
                  <TableRow key={discipline.id}>
                    <TableCell className="font-medium">{discipline.code}</TableCell>
                    <TableCell>{discipline.name}</TableCell>
                    <TableCell>
                      <Badge variant={discipline.contentStatus === 'complete' ? 'default' : 'outline'}>
                        {discipline.contentStatus === 'complete' ? 'Completa' : 'Incompleta'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/admin/academico/disciplines/${discipline.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </Link>
                        <Link href={`/admin/academico/disciplines/${discipline.id}/content`}>
                          <Button variant="default" size="sm">
                            <BookOpen className="h-4 w-4 mr-1" />
                            Conteúdo
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}