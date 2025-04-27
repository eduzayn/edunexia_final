import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllDisciplines } from "@/api/disciplines";
import { Discipline } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, SearchIcon, MoreHorizontal, Pencil, Trash, BookOpen } from "lucide-react";

export function DisciplineList() {
  // Estado para busca
  const [searchTerm, setSearchTerm] = useState("");

  // Consulta para buscar disciplinas
  const { data: disciplines, isLoading, error } = useQuery({
    queryKey: ["/api/admin/disciplines"],
    queryFn: getAllDisciplines,
  });

  // Filtrar disciplinas com base na busca
  const filteredDisciplines = disciplines
    ? disciplines.filter(
        (discipline) =>
          discipline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          discipline.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (discipline.description &&
            discipline.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      )
    : [];

  // Renderizar o status de uma disciplina
  const renderContentStatus = (status: string) => {
    switch (status) {
      case "complete":
        return <Badge className="bg-green-500">Completo</Badge>;
      case "incomplete":
        return <Badge variant="outline">Incompleto</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar disciplina..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link href="/admin/academic/disciplines/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Nova Disciplina
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Disciplinas</CardTitle>
          <CardDescription>
            Lista de todas as disciplinas disponíveis na plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Carregando disciplinas...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 p-4 rounded-md">
              <p className="text-destructive">
                Erro ao carregar disciplinas. Tente novamente mais tarde.
              </p>
            </div>
          ) : filteredDisciplines.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Nenhuma disciplina encontrada com os critérios de busca."
                  : "Nenhuma disciplina cadastrada."}
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
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
                  {filteredDisciplines.map((discipline) => (
                    <TableRow key={discipline.id}>
                      <TableCell className="font-medium">
                        {discipline.code}
                      </TableCell>
                      <TableCell>{discipline.name}</TableCell>
                      <TableCell>
                        {discipline.workload ? `${discipline.workload}h` : "N/A"}
                      </TableCell>
                      <TableCell>
                        {renderContentStatus(discipline.contentStatus || "incomplete")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/academic/disciplines/${discipline.id}/content`}>
                                <BookOpen className="mr-2 h-4 w-4" />
                                <span>Gerenciar Conteúdo</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/academic/disciplines/${discipline.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Editar</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => {
                                e.preventDefault();
                                if (confirm("Tem certeza que deseja excluir esta disciplina?")) {
                                  // Lógica de exclusão seria implementada aqui
                                  // Seria necessário criar um serviço de exclusão de disciplinas
                                  console.log(`Excluir disciplina ${discipline.id}`);
                                }
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Excluir</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 