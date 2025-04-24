import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import StudentLayout from "@/components/layout/student-layout";
import { BookOpen, BookMarked } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  MenuBookIcon,
  SearchIcon,
  BookmarkIcon,
  FilterIcon,
  SortIcon,
  BookIcon,
  LayersIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Interface para materiais da biblioteca
interface LibraryItem {
  id: number;
  title: string;
  author: string;
  category: string;
  type: "ebook" | "article" | "thesis" | "textbook" | "paper";
  coverImage?: string;
  downloadUrl?: string;
  publishedAt: string;
  publisher: string;
  description: string;
  tags: string[];
  isBorrowed?: boolean;
}

export default function LibraryPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [myBookmarks, setMyBookmarks] = useState<number[]>([]);
  const [myBorrowings, setMyBorrowings] = useState<number[]>([]);
  const [selectedTab, setSelectedTab] = useState("all");

  // Simular itens da biblioteca
  const mockLibraryItems: LibraryItem[] = [
    {
      id: 1,
      title: "Fundamentos de Programação em Python",
      author: "Ana Silva",
      category: "Tecnologia",
      type: "ebook",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=Python",
      downloadUrl: "#",
      publishedAt: "2023-05-15",
      publisher: "EdunexIA Press",
      description: "Um guia completo para iniciantes em programação Python, abordando conceitos fundamentais e práticas modernas.",
      tags: ["python", "programação", "tecnologia"]
    },
    {
      id: 2,
      title: "Gestão Estratégica de Projetos",
      author: "Carlos Mendes",
      category: "Administração",
      type: "textbook",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=Gestão",
      downloadUrl: "#",
      publishedAt: "2022-10-20",
      publisher: "Business Academy",
      description: "Material didático sobre metodologias modernas de gestão de projetos e planejamento estratégico.",
      tags: ["gestão", "projetos", "estratégia", "administração"]
    },
    {
      id: 3,
      title: "A Evolução da Inteligência Artificial",
      author: "Roberto Almeida",
      category: "Tecnologia",
      type: "article",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=IA",
      downloadUrl: "#",
      publishedAt: "2023-02-10",
      publisher: "Revista TechWorld",
      description: "Artigo científico que analisa o desenvolvimento da IA nos últimos anos e suas aplicações práticas.",
      tags: ["inteligência artificial", "tecnologia", "inovação"]
    },
    {
      id: 4,
      title: "Análise de Dados com Python e Pandas",
      author: "Juliana Costa",
      category: "Tecnologia",
      type: "ebook",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=Pandas",
      downloadUrl: "#",
      publishedAt: "2023-01-05",
      publisher: "EdunexIA Press",
      description: "E-book prático sobre análise de dados utilizando a biblioteca Pandas do Python e técnicas de visualização.",
      tags: ["python", "pandas", "análise de dados", "data science"]
    },
    {
      id: 5,
      title: "Marketing Digital para Pequenas Empresas",
      author: "Fernanda Lima",
      category: "Marketing",
      type: "textbook",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=Marketing",
      downloadUrl: "#",
      publishedAt: "2022-09-18",
      publisher: "Business Academy",
      description: "Guia completo de estratégias de marketing digital focadas em pequenos negócios.",
      tags: ["marketing", "digital", "negócios", "redes sociais"]
    },
    {
      id: 6,
      title: "Impactos da Indústria 4.0 no Mercado de Trabalho",
      author: "Ricardo Oliveira",
      category: "Economia",
      type: "thesis",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=Indústria+4.0",
      downloadUrl: "#",
      publishedAt: "2023-03-22",
      publisher: "Universidade Federal",
      description: "Tese de doutorado analisando as transformações no mercado de trabalho decorrentes da quarta revolução industrial.",
      tags: ["indústria 4.0", "mercado de trabalho", "automação", "economia"]
    },
    {
      id: 7,
      title: "React.js na Prática: Desenvolvimento de Aplicações Web",
      author: "Marcos Paulo",
      category: "Tecnologia",
      type: "ebook",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=React.js",
      downloadUrl: "#",
      publishedAt: "2023-04-10",
      publisher: "EdunexIA Press",
      description: "Manual prático para desenvolvimento de aplicações modernas com React.js e seu ecossistema.",
      tags: ["react", "javascript", "frontend", "desenvolvimento web"]
    },
    {
      id: 8,
      title: "Sustentabilidade nas Organizações",
      author: "Luísa Cardoso",
      category: "Meio Ambiente",
      type: "paper",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=Sustentabilidade",
      downloadUrl: "#",
      publishedAt: "2022-12-05",
      publisher: "Revista EcoEmpresa",
      description: "Artigo sobre práticas sustentáveis aplicadas ao ambiente corporativo e seus benefícios.",
      tags: ["sustentabilidade", "ESG", "meio ambiente", "gestão"]
    },
    {
      id: 9,
      title: "Psicologia Positiva na Educação",
      author: "Daniela Martins",
      category: "Psicologia",
      type: "textbook",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=Psicologia",
      downloadUrl: "#",
      publishedAt: "2023-02-18",
      publisher: "EdunexIA Press",
      description: "Manual sobre aplicação de técnicas da psicologia positiva no contexto educacional.",
      tags: ["psicologia", "educação", "bem-estar", "desenvolvimento humano"]
    },
    {
      id: 10,
      title: "Blockchain e Criptomoedas: Fundamentos e Aplicações",
      author: "Henrique Silva",
      category: "Finanças",
      type: "ebook",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=Blockchain",
      downloadUrl: "#",
      publishedAt: "2023-01-30",
      publisher: "FinTech Books",
      description: "Introdução às tecnologias blockchain e ao universo das criptomoedas, abordando aspectos técnicos e financeiros.",
      tags: ["blockchain", "criptomoedas", "finanças", "tecnologia"]
    }
  ];

  // Filtrar e ordenar itens da biblioteca
  const filteredItems = mockLibraryItems
    .filter(item => {
      // Aplicar filtro de busca
      if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !item.author.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !item.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Aplicar filtro de categoria
      if (filterCategory !== "all" && item.category !== filterCategory) {
        return false;
      }
      
      // Aplicar filtro de tipo
      if (filterType !== "all" && item.type !== filterType) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Aplicar ordenação
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "author":
          return a.author.localeCompare(b.author);
        case "recent":
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

  // Extrair categorias únicas para o filtro
  const uniqueCategories = Array.from(new Set(mockLibraryItems.map(item => item.category)));
  
  // Função para alternar item nos favoritos
  const toggleBookmark = (id: number) => {
    if (myBookmarks.includes(id)) {
      setMyBookmarks(myBookmarks.filter(bookmark => bookmark !== id));
    } else {
      setMyBookmarks([...myBookmarks, id]);
    }
  };
  
  // Função para alternar empréstimo do item
  const toggleBorrowing = (id: number) => {
    if (myBorrowings.includes(id)) {
      setMyBorrowings(myBorrowings.filter(borrowing => borrowing !== id));
    } else {
      setMyBorrowings([...myBorrowings, id]);
    }
  };

  // Função para navegar para a tab "all"
  const navigateToAllTab = () => {
    setSelectedTab("all");
  };

  // Renderizar detalhes do item selecionado
  const renderItemDetails = () => {
    if (!selectedItem) return null;
    
    return (
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{selectedItem.title}</DialogTitle>
          <DialogDescription>
            Por {selectedItem.author} • {selectedItem.publisher}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          <div className="md:col-span-1">
            <div className="overflow-hidden rounded-md">
              <img 
                src={selectedItem.coverImage || "https://placehold.co/600x800/e2e8f0/475569?text=Sem+Imagem"} 
                alt={selectedItem.title}
                className="w-full object-cover aspect-[3/4]"
              />
            </div>
            <div className="mt-4 space-y-2">
              <Badge variant="outline" className="mr-1">{selectedItem.category}</Badge>
              <Badge variant="outline" className="mr-1">{
                selectedItem.type === "ebook" ? "E-book" :
                selectedItem.type === "article" ? "Artigo" :
                selectedItem.type === "thesis" ? "Tese" :
                selectedItem.type === "textbook" ? "Livro Didático" :
                selectedItem.type === "paper" ? "Artigo Científico" : 
                "Outro"
              }</Badge>
              <div className="flex justify-between mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleBookmark(selectedItem.id)}
                >
                  <BookmarkIcon className={`h-4 w-4 mr-2 ${myBookmarks.includes(selectedItem.id) ? 'text-yellow-500' : ''}`} />
                  {myBookmarks.includes(selectedItem.id) ? 'Favorito' : 'Favoritar'}
                </Button>
                <Button 
                  variant={myBorrowings.includes(selectedItem.id) ? "destructive" : "default"} 
                  size="sm"
                  onClick={() => toggleBorrowing(selectedItem.id)}
                >
                  {myBorrowings.includes(selectedItem.id) ? 'Devolver' : 'Emprestar'}
                </Button>
              </div>
            </div>
          </div>
          <div className="md:col-span-2 space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-1">Descrição</h3>
              <p className="text-gray-700">{selectedItem.description}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Informações do Item</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li><span className="font-medium">Autor:</span> {selectedItem.author}</li>
                <li><span className="font-medium">Editora:</span> {selectedItem.publisher}</li>
                <li><span className="font-medium">Data de Publicação:</span> {new Date(selectedItem.publishedAt).toLocaleDateString('pt-BR')}</li>
                <li>
                  <span className="font-medium">Tags:</span>{' '}
                  {selectedItem.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="mr-1 mt-1">{tag}</Badge>
                  ))}
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          {selectedItem.downloadUrl && (
            <Button asChild>
              <a href={selectedItem.downloadUrl} target="_blank" rel="noopener noreferrer">
                Download
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    );
  };

  // Renderizar item da biblioteca na visualização em grade
  const renderGridItem = (item: LibraryItem) => {
    return (
      <Card key={item.id} className="overflow-hidden flex flex-col h-full">
        <div className="relative">
          {myBookmarks.includes(item.id) && (
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20">
                <BookmarkIcon className="h-3 w-3 mr-1 text-yellow-500" /> Favorito
              </Badge>
            </div>
          )}
          <div className="aspect-[3/4] relative overflow-hidden">
            <img 
              src={item.coverImage || "https://placehold.co/600x800/e2e8f0/475569?text=Sem+Imagem"} 
              alt={item.title}
              className="w-full h-full object-cover transition-transform hover:scale-105"
            />
          </div>
        </div>
        <CardContent className="flex-grow p-4">
          <h3 className="font-medium text-gray-900 line-clamp-1">{item.title}</h3>
          <p className="text-sm text-gray-600 mb-2">{item.author}</p>
          <div className="flex flex-wrap gap-1 mb-2">
            <Badge variant="outline" className="text-xs">{item.category}</Badge>
            <Badge variant="outline" className="text-xs">{
              item.type === "ebook" ? "E-book" :
              item.type === "article" ? "Artigo" :
              item.type === "thesis" ? "Tese" :
              item.type === "textbook" ? "Livro Didático" :
              item.type === "paper" ? "Artigo Científico" : 
              "Outro"
            }</Badge>
          </div>
          <p className="text-xs text-gray-500 line-clamp-2 mb-4">
            {item.description}
          </p>
        </CardContent>
        <CardFooter className="px-4 pb-4 pt-0 mt-auto">
          <div className="flex justify-between w-full">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => toggleBookmark(item.id)}
              className="px-2"
            >
              <BookmarkIcon className={`h-4 w-4 mr-1 ${myBookmarks.includes(item.id) ? 'text-yellow-500' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedItem(item)}
            >
              Ver detalhes
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  // Renderizar item da biblioteca na visualização em lista
  const renderListItem = (item: LibraryItem) => {
    return (
      <Card key={item.id} className="w-full mb-4">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-[150px] shrink-0 p-4">
            <div className="aspect-[3/4] relative overflow-hidden rounded-md">
              <img 
                src={item.coverImage || "https://placehold.co/600x800/e2e8f0/475569?text=Sem+Imagem"} 
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="flex-grow p-4">
            <div className="flex flex-wrap justify-between items-start mb-2">
              <div>
                <h3 className="font-medium text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.author}</p>
              </div>
              <div className="flex">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleBookmark(item.id)}
                  className="px-2 h-8"
                >
                  <BookmarkIcon className={`h-4 w-4 ${myBookmarks.includes(item.id) ? 'text-yellow-500' : ''}`} />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              <Badge variant="outline" className="text-xs">{item.category}</Badge>
              <Badge variant="outline" className="text-xs">{
                item.type === "ebook" ? "E-book" :
                item.type === "article" ? "Artigo" :
                item.type === "thesis" ? "Tese" :
                item.type === "textbook" ? "Livro Didático" :
                item.type === "paper" ? "Artigo Científico" : 
                "Outro"
              }</Badge>
              <Badge variant="outline" className="text-xs">
                {new Date(item.publishedAt).toLocaleDateString('pt-BR')}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">
              {item.description}
            </p>
            <div className="flex justify-end">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setSelectedItem(item)}
              >
                Ver detalhes
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <StudentLayout
      title="Biblioteca Digital"
      subtitle="Acesse materiais didáticos e recursos acadêmicos"
      breadcrumbs={[
        { title: "Home", href: "/student" },
        { title: "Biblioteca", href: "/student/library" }
      ]}
    >
      {/* Barra de pesquisa e filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-grow relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Pesquisar por título, autor ou palavra-chave"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="w-full sm:w-[180px]">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-[180px]">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="ebook">E-books</SelectItem>
                <SelectItem value="article">Artigos</SelectItem>
                <SelectItem value="thesis">Teses</SelectItem>
                <SelectItem value="textbook">Livros Didáticos</SelectItem>
                <SelectItem value="paper">Artigos Científicos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-[180px]">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Título (A-Z)</SelectItem>
                <SelectItem value="author">Autor (A-Z)</SelectItem>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="category">Categoria</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex">
            <Button
              variant={viewType === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewType("grid")}
              className="rounded-r-none"
            >
              <LayersIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewType === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewType("list")}
              className="rounded-l-none"
            >
              <BookIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo da biblioteca */}
      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">Todos os materiais</TabsTrigger>
          <TabsTrigger value="bookmarks">Meus favoritos</TabsTrigger>
          <TabsTrigger value="borrowings">Emprestados</TabsTrigger>
          <TabsTrigger value="recents">Adicionados recentemente</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <BookOpenText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <h3 className="text-lg font-medium text-gray-700">Nenhum material encontrado</h3>
              <p className="text-gray-500 mt-1">Tente ajustar seus filtros de busca</p>
              {searchTerm && (
                <Button variant="outline" className="mt-4" onClick={() => setSearchTerm("")}>
                  Limpar busca
                </Button>
              )}
            </div>
          ) : (
            <div className={
              viewType === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
              {viewType === "grid"
                ? filteredItems.map(item => renderGridItem(item))
                : filteredItems.map(item => renderListItem(item))
              }
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookmarks">
          {myBookmarks.length === 0 ? (
            <div className="text-center py-8">
              <BookmarkIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <h3 className="text-lg font-medium text-gray-700">Nenhum favorito ainda</h3>
              <p className="text-gray-500 mt-1">Marque itens como favoritos para encontrá-los facilmente aqui</p>
              <Button variant="outline" className="mt-4" onClick={navigateToAllTab}>
                Explorar biblioteca
              </Button>
            </div>
          ) : (
            <div className={
              viewType === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
              {viewType === "grid"
                ? mockLibraryItems.filter(item => myBookmarks.includes(item.id)).map(item => renderGridItem(item))
                : mockLibraryItems.filter(item => myBookmarks.includes(item.id)).map(item => renderListItem(item))
              }
            </div>
          )}
        </TabsContent>

        <TabsContent value="borrowings">
          {myBorrowings.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <h3 className="text-lg font-medium text-gray-700">Nenhum empréstimo ativo</h3>
              <p className="text-gray-500 mt-1">Você não tem materiais emprestados no momento</p>
              <Button variant="outline" className="mt-4" onClick={navigateToAllTab}>
                Explorar biblioteca
              </Button>
            </div>
          ) : (
            <div className={
              viewType === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
              {viewType === "grid"
                ? mockLibraryItems.filter(item => myBorrowings.includes(item.id)).map(item => renderGridItem(item))
                : mockLibraryItems.filter(item => myBorrowings.includes(item.id)).map(item => renderListItem(item))
              }
            </div>
          )}
        </TabsContent>

        <TabsContent value="recents">
          <div className={
            viewType === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" 
            : "space-y-4"
          }>
            {viewType === "grid"
              ? mockLibraryItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 8).map(item => renderGridItem(item))
              : mockLibraryItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 8).map(item => renderListItem(item))
            }
          </div>
        </TabsContent>
      </Tabs>

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(isOpen) => !isOpen && setSelectedItem(null)}>
        {renderItemDetails()}
      </Dialog>
    </StudentLayout>
  );
}