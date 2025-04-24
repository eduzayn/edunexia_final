# Documentação de Deploy no Vercel

Este documento descreve as configurações e procedimentos para deploy da aplicação no Vercel.

## Configuração do Build

O projeto utiliza um script de build personalizado `vercel-build.js` que:

1. Verifica a existência do arquivo `index.html`
2. Executa o build do frontend com Vite
3. Compila os arquivos do servidor com esbuild
4. Compila as APIs específicas para o formato serverless
5. Garante que o arquivo `index.html` esteja disponível no diretório de saída

## Estrutura do Projeto

- **Frontend**: O código frontend está em `/client` e é compilado para `/dist/public`
- **Backend**: O código backend está em `/server` e é compilado para `/dist`
- **APIs Serverless**: Arquivos específicos para funções serverless estão em `/server/api` e são compilados para `/dist/api`

## Arquivo de Configuração Vercel

O arquivo `vercel.json` contém:

1. Comando de build: `node vercel-build.js`
2. Diretório de saída: `dist`
3. Configurações de rotas (rewrites) para API e arquivos estáticos
4. Headers HTTP para segurança e CORS
5. Variáveis de ambiente para produção

## Variáveis de Ambiente

Certifique-se de configurar estas variáveis no Vercel:

- DATABASE_URL
- JWT_SECRET
- SESSION_SECRET
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- SENDGRID_API_KEY
- ASAAS_ZAYN_KEY
- ASAAS_CERTIFIC_KEY

## Procedimento de Deploy

1. Faça push para a branch `deploy-vercel`
2. O Vercel detectará automaticamente as alterações e iniciará o build
3. Verifique os logs de build para garantir que não há erros
4. Acesse a aplicação pela URL fornecida pelo Vercel

## Solução de Problemas

Se encontrar problemas durante o deploy:

1. Verifique os logs de build no painel do Vercel
2. Confirme que todas as variáveis de ambiente estão configuradas
3. Verifique se o script `vercel-build.js` está funcionando corretamente
4. Certifique-se de que o arquivo `index.html` está sendo localizado e copiado corretamente

## Notas Importantes

- O arquivo `.vercelignore` é usado para excluir arquivos desnecessários do deploy
- A compilação dos arquivos da API é feita separadamente para otimizar o serverless
- As configurações de segurança estão definidas no arquivo `vercel.json`