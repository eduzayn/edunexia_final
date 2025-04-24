# Implantação na Vercel - EdunexIA

Este guia fornece instruções para implantar a aplicação EdunexIA na Vercel.

## Prevenindo Exposição de Código-Fonte

Um problema comum no deploy Vercel é a exposição do código-fonte TypeScript/JavaScript não compilado. Para evitar isso:

1. **Configure corretamente o vercel.json**:
   - Utilize a seção `builds` para especificar quais arquivos serão compilados
   - Garanta que `outputDirectory` esteja configurado corretamente como `dist` 
   - Use a configuração atualizada abaixo

2. **Utilize .vercelignore**:
   - Crie um arquivo `.vercelignore` para evitar que arquivos de código-fonte sejam enviados
   - Inclua pastas como `/shared/`, `/server/` (exceto arquivos específicos de API)
   - Ignore arquivos de desenvolvimento e configuração

3. **Script de build personalizado**:
   - O script `vercel-build.sh` garantirá compilação adequada dos componentes
   - Certifique-se que o script seja executável (`chmod +x vercel-build.sh`)
   - Configure o Build Command na Vercel para usar `./vercel-build.sh`

## Correção de Problemas de Implantação

Ao fazer o deploy na Vercel, podem ocorrer erros relacionados a problemas na compilação dos módulos shared/certificate-schema.ts e shared/certification-request-schema.ts, devido a diferenças no ambiente serverless da Vercel.

### Solução para o Erro de Compilação

O erro exibido no console do Vercel é relacionado à importação e processamento dos arquivos de schema do Drizzle:

```
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
[...]
import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json, pgEnum } from "drizzle-orm/pg-core";
[...]
```

Este erro ocorre porque o Vercel tem dificuldades em processar os módulos TypeScript com importações complexas em ambiente serverless. Para resolver esse problema:

1. **Use os arquivos serverless especializados**:
   - Use `server/api/index.js` e `server/api/login.js` que foram adaptados para o ambiente serverless da Vercel
   - Estes arquivos evitam as importações problemáticas e fornecem funcionalidade básica para a API

2. **Configuração do ambiente**:
   - Adicione a variável `VERCEL=1` nas configurações do projeto na Vercel
   - Isso ativa adaptações específicas no código para o ambiente serverless

3. **Simplificação para o ambiente serverless**:
   - O arquivo `module-alias.js` ajuda a resolver problemas de caminho no ambiente serverless
   - Adapte importações complexas para formatos mais simples no ambiente Vercel

Se o problema persistir, você pode precisar adaptar diretamente os arquivos de schema para o formato ESM tradicional, removendo alguns recursos avançados do TypeScript.

## Pré-requisitos

- Conta na Vercel (https://vercel.com)
- Conta no GitHub ou GitLab para integração com a Vercel
- Banco de dados PostgreSQL (recomendamos Neon.tech para compatibilidade com Vercel)

## Passos para Implantação

1. **Preparar Banco de Dados**
   - Configure seu banco de dados PostgreSQL no Neon.tech ou outro provedor
   - Copie a string de conexão que será usada nas variáveis de ambiente

2. **Configurar Variáveis de Ambiente**
   - No dashboard da Vercel, adicione as seguintes variáveis de ambiente:
     ```
     DATABASE_URL=postgresql://usuario:senha@host:porta/banco-de-dados
     JWT_SECRET=seu_segredo_jwt_aqui
     JWT_EXPIRES_IN=1d
     CORS_ORIGIN=https://seu-dominio.vercel.app
     STRIPE_SECRET_KEY=sk_test_xxxxxxx
     STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxx
     STRIPE_WEBHOOK_SECRET=whsec_xxxxxxx
     SENDGRID_API_KEY=SG.xxxxxxx
     EMAIL_FROM=seu-email@dominio.com
     TWILIO_ACCOUNT_SID=ACxxxxxxx
     TWILIO_AUTH_TOKEN=xxxxxxx
     TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
     OPENAI_API_KEY=sk-xxxxxx
     ```

3. **Implantar na Vercel**
   - Conecte seu repositório GitHub/GitLab à Vercel
   - Configure as opções de implantação:
     - Build Command: `npm run vercel-build`
     - Output Directory: `dist`
     - Node.js Version: 18.x (ou superior)
   - Clique em "Deploy"

4. **Configurar Domínio Personalizado (Opcional)**
   - No dashboard da Vercel, vá para "Domains"
   - Adicione seu domínio personalizado e siga as instruções

## Estrutura de Arquivos para Vercel

A aplicação está configurada para trabalhar com a Vercel através dos seguintes arquivos:

- `vercel.json`: Configuração principal para a Vercel
- `server/api/index.js`: Ponto de entrada para as APIs serverless
- `server/api/login.js`: Endpoint específico para login no Vercel
- `server/module-alias.js`: Resolvedor de caminhos para importações no Vercel
- `server/auth/token.js`: Módulo de autenticação adaptado para o formato ESM
- `client/src/lib/api-vercel-config.ts`: Configurações de API específicas para o Vercel
- `package.json`: Script "vercel-build" para build específico da Vercel

## Problemas Comuns

### CORS
Se encontrar problemas de CORS, verifique se a variável `CORS_ORIGIN` está configurada corretamente com o domínio da sua aplicação.

### Banco de Dados
A Vercel funciona melhor com bancos de dados PostgreSQL que suportam conexões serverless. Recomendamos fortemente o Neon.tech para este propósito.

### Timeout em Funções
Se suas funções estiverem atingindo o timeout da Vercel, considere otimizar ou dividir operações longas em várias funções menores.

## Monitoramento

Após a implantação, você pode monitorar sua aplicação através do dashboard da Vercel, que fornece:
- Logs de aplicação
- Métricas de desempenho
- Análise de uso de recursos

## Atualização da Aplicação

Para atualizar sua aplicação:
1. Faça push das alterações para o repositório conectado
2. A Vercel automaticamente iniciará uma nova implantação
3. Acompanhe o progresso no dashboard da Vercel 