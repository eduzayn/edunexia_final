# Implantação na Vercel - EdunexIA

Este guia fornece instruções para implantar a aplicação EdunexIA na Vercel.

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