import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import NavbarMain from "@/components/layout/navbar-main";
import FooterMain from "@/components/layout/footer-main";
import { PageTransition } from "@/components/ui/page-transition";

export default function RegistrationSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarMain />
      
      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <PageTransition>
          <Card className="max-w-md w-full shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Cadastro Realizado com Sucesso!</CardTitle>
              <CardDescription>
                Sua instituição foi cadastrada com sucesso na plataforma EdunexIA.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p>
                Um email de confirmação foi enviado para o endereço de email fornecido no cadastro.
                Por favor, verifique sua caixa de entrada e siga as instruções para ativar sua conta.
              </p>
              <p>
                Você já pode acessar a plataforma utilizando as credenciais que você cadastrou.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
              <Button asChild variant="default">
                <a href="/autenticacao/auth-page">Fazer Login</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/">Voltar para Página Inicial</a>
              </Button>
            </CardFooter>
          </Card>
        </PageTransition>
      </main>
      
      <FooterMain />
    </div>
  );
} 