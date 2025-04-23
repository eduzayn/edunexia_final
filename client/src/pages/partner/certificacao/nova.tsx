import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  UploadCloud, 
  FileText, 
  Save, 
  ArrowLeft, 
  Users,
  Plus,
  File,
  X,
  AlertCircle
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import {
  ChartIcon,
  PaymentsIcon,
  PeopleIcon,
  TrendingUpIcon,
  GroupIcon,
  AccountBalanceIcon,
  ComputerIcon,
  ShowChartIcon,
  SettingsIcon,
  HelpOutlineIcon,
  PersonAddIcon,
  MonetizationOnIcon,
  ArrowUpwardIcon,
  ReceiptIcon,
  AwardIcon
} from "@/components/ui/icons";

export default function NovaSolicitacaoCertificacaoPage() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("individual");
  const [location, setLocation] = useLocation();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Form handling
  const form = useForm({
    defaultValues: {
      nomeAluno: "",
      cpf: "",
      email: "",
      telefone: "",
      curso: "",
      observacoes: ""
    }
  });

  // Lista mocada de cursos disponíveis
  const cursos = [
    { id: 1, nome: "MBA em Gestão Empresarial", categoria: "MBA" },
    { id: 2, nome: "Pós-Graduação em Marketing Digital", categoria: "Pós-Graduação" },
    { id: 3, nome: "Segunda Licenciatura em Pedagogia", categoria: "Segunda Licenciatura" },
    { id: 4, nome: "Especialização em Direito Digital", categoria: "Especialização" },
    { id: 5, nome: "Pós-Graduação em Engenharia de Software", categoria: "Pós-Graduação" },
  ];

  // Sidebar items for partner portal
  const sidebarItems = [
    { name: "Dashboard", icon: <ChartIcon />, href: "/partner/dashboard" },
    { name: "Certificação", icon: <AwardIcon />, active: true, href: "/partner/certificacao" },
    { name: "Referências", icon: <PeopleIcon />, href: "/partner/referrals" },
    { name: "Comissões", icon: <MonetizationOnIcon />, href: "/partner/commissions" },
    { name: "Materiais", icon: <ComputerIcon />, href: "/partner/materials" },
    { name: "Relatórios", icon: <ShowChartIcon />, href: "/partner/reports" },
    { name: "Suporte", icon: <HelpOutlineIcon />, href: "/partner/support" },
    { name: "Configurações", icon: <SettingsIcon />, href: "/partner/settings" },
  ];

  // Função para lidar com o envio do formulário
  const onSubmit = (data: any) => {
    console.log("Dados do formulário:", data);
    console.log("Arquivos enviados:", uploadedFiles);
    
    // Aqui você implementaria a lógica para enviar a solicitação para o backend
    
    // Redirecionar de volta para a página de certificação após o envio
    setLocation("/partner/certificacao");
  };

  // Função para lidar com o upload de arquivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  // Função para remover um arquivo
  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={sidebarItems}
        user={user}
        portalType="partner"
        portalColor="#7C4DFC"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-20 md:py-6 md:px-8">
          {/* Header with Back Button */}
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-4" 
              onClick={() => setLocation("/partner/certificacao")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nova Solicitação de Certificação</h1>
              <p className="text-gray-600">Preencha os dados do aluno e faça o upload dos documentos necessários.</p>
            </div>
          </div>

          <Tabs 
            defaultValue="individual" 
            className="w-full" 
            value={activeTab} 
            onValueChange={setActiveTab}
          >
            <TabsList className="mb-6">
              <TabsTrigger value="individual">Solicitação Individual</TabsTrigger>
              <TabsTrigger value="lote">Solicitação em Lote</TabsTrigger>
            </TabsList>

            {/* Conteúdo da aba Solicitação Individual */}
            <TabsContent value="individual" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Aluno</CardTitle>
                  <CardDescription>Informe os dados do aluno para certificação</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nome do Aluno */}
                        <FormField
                          control={form.control}
                          name="nomeAluno"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo do Aluno</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome completo" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* CPF */}
                        <FormField
                          control={form.control}
                          name="cpf"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF</FormLabel>
                              <FormControl>
                                <Input placeholder="000.000.000-00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Email */}
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="email@exemplo.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Telefone */}
                        <FormField
                          control={form.control}
                          name="telefone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone</FormLabel>
                              <FormControl>
                                <Input placeholder="(00) 00000-0000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Curso */}
                        <FormField
                          control={form.control}
                          name="curso"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Curso</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o curso" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {cursos.map((curso) => (
                                    <SelectItem key={curso.id} value={curso.id.toString()}>
                                      {curso.nome} ({curso.categoria})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Observações */}
                        <FormField
                          control={form.control}
                          name="observacoes"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Observações (opcional)</FormLabel>
                              <FormControl>
                                <textarea 
                                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  placeholder="Observações adicionais sobre a solicitação" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator />
                      
                      {/* Seção de Upload de Documentos */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Documentos do Aluno</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Faça o upload dos documentos necessários para a certificação. Os documentos devem estar em formato PDF, JPG ou PNG.
                        </p>
                        
                        {/* Lista de documentos necessários */}
                        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start space-x-2">
                            <div className="w-4 h-4 rounded-full bg-yellow-400 mt-1"></div>
                            <div>
                              <p className="font-medium">RG ou CNH (frente e verso)</p>
                              <p className="text-xs text-gray-600">Documento de identificação</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-4 h-4 rounded-full bg-yellow-400 mt-1"></div>
                            <div>
                              <p className="font-medium">Diploma da Graduação</p>
                              <p className="text-xs text-gray-600">Comprovante de formação anterior</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-4 h-4 rounded-full bg-yellow-400 mt-1"></div>
                            <div>
                              <p className="font-medium">Histórico Escolar</p>
                              <p className="text-xs text-gray-600">Histórico escolar da graduação</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-4 h-4 rounded-full bg-yellow-400 mt-1"></div>
                            <div>
                              <p className="font-medium">Comprovante de Residência</p>
                              <p className="text-xs text-gray-600">Documento recente</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Componente de upload */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
                          <div className="mb-4">
                            <UploadCloud className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              Arraste e solte arquivos aqui ou clique no botão abaixo
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Formatos suportados: PDF, JPG, PNG (máx. 10MB por arquivo)
                            </p>
                          </div>
                          <Label 
                            htmlFor="file-upload" 
                            className="cursor-pointer inline-flex items-center px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90"
                          >
                            <UploadCloud className="h-4 w-4 mr-2" />
                            Selecionar arquivos
                          </Label>
                          <input 
                            id="file-upload" 
                            type="file" 
                            multiple 
                            className="hidden" 
                            onChange={handleFileChange}
                          />
                        </div>
                        
                        {/* Lista de arquivos enviados */}
                        {uploadedFiles.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Arquivos enviados:</h4>
                            <div className="space-y-2">
                              {uploadedFiles.map((file, index) => (
                                <div 
                                  key={index} 
                                  className="flex items-center justify-between rounded-md border border-gray-200 p-3"
                                >
                                  <div className="flex items-center">
                                    <FileText className="h-5 w-5 text-blue-500 mr-2" />
                                    <div>
                                      <p className="font-medium text-sm">{file.name}</p>
                                      <p className="text-xs text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    </div>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => removeFile(index)}
                                  >
                                    <X className="h-4 w-4 text-gray-500" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Botões de ação */}
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          type="button" 
                          onClick={() => setLocation("/partner/certificacao")}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={uploading || uploadedFiles.length === 0}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Enviar Solicitação
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Conteúdo da aba Solicitação em Lote */}
            <TabsContent value="lote" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Solicitação em Lote</CardTitle>
                  <CardDescription>
                    Faça o upload de uma planilha CSV com os dados dos alunos ou adicione múltiplos alunos manualmente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="csv">
                    <TabsList className="mb-4">
                      <TabsTrigger value="csv">Upload de CSV</TabsTrigger>
                      <TabsTrigger value="manual">Preenchimento Manual</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="csv" className="space-y-6">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <div className="mb-4">
                          <UploadCloud className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            Arraste e solte um arquivo CSV aqui ou clique no botão abaixo
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Baixe o <a href="#" className="text-blue-600 underline">modelo de planilha</a> para preencher corretamente
                          </p>
                        </div>
                        <Label 
                          htmlFor="csv-upload" 
                          className="cursor-pointer inline-flex items-center px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90"
                        >
                          <UploadCloud className="h-4 w-4 mr-2" />
                          Selecionar arquivo CSV
                        </Label>
                        <input 
                          id="csv-upload" 
                          type="file" 
                          accept=".csv" 
                          className="hidden" 
                        />
                      </div>
                      
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-sm text-blue-700">
                        <p className="font-medium mb-1">Instruções para o arquivo CSV:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>O arquivo deve estar em formato CSV (valores separados por vírgula)</li>
                          <li>A primeira linha deve conter os cabeçalhos: Nome, CPF, Email, Telefone, Curso</li>
                          <li>O ID do curso deve corresponder aos cursos disponíveis em sua instituição</li>
                          <li>Tamanho máximo do arquivo: 5MB</li>
                        </ul>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="manual" className="space-y-6">
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          Adicione múltiplos alunos manualmente preenchendo os campos abaixo. Você pode adicionar mais alunos clicando no botão "Adicionar Aluno".
                        </p>
                        
                        {/* Formulário para adição manual */}
                        <Card className="border-l-4 border-blue-500">
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label htmlFor="nome1">Nome Completo</Label>
                                <Input id="nome1" placeholder="Nome completo" />
                              </div>
                              <div>
                                <Label htmlFor="cpf1">CPF</Label>
                                <Input id="cpf1" placeholder="000.000.000-00" />
                              </div>
                              <div>
                                <Label htmlFor="email1">Email</Label>
                                <Input id="email1" placeholder="email@exemplo.com" />
                              </div>
                              <div>
                                <Label htmlFor="telefone1">Telefone</Label>
                                <Input id="telefone1" placeholder="(00) 00000-0000" />
                              </div>
                              <div className="md:col-span-2">
                                <Label htmlFor="curso1">Curso</Label>
                                <Select>
                                  <SelectTrigger id="curso1">
                                    <SelectValue placeholder="Selecione o curso" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {cursos.map((curso) => (
                                      <SelectItem key={curso.id} value={curso.id.toString()}>
                                        {curso.nome} ({curso.categoria})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Button 
                          variant="outline" 
                          className="w-full border-dashed"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Aluno
                        </Button>
                        
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 text-sm text-yellow-700">
                          <p className="flex items-center font-medium">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Atenção:
                          </p>
                          <p>
                            Os documentos dos alunos (RG, Diploma, etc.) deverão ser enviados individualmente após o envio desta solicitação.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 border-t pt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation("/partner/certificacao")}
                  >
                    Cancelar
                  </Button>
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Enviar Solicitação
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}