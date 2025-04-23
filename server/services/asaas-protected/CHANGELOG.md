# Histórico de Alterações - Integração Asaas

## Versão 1.0.0 (23/04/2025)

### Correções críticas:
- ✅ Formatação de CPF/CNPJ para remover caracteres especiais (pontos, traços, barras)
- ✅ Adição de tipo de pessoa (personType) com valor padrão 'FISICA'
- ✅ Tratamento detalhado de erros da API Asaas
- ✅ Correção de duplicidade na interface AsaasPaymentResponse (creditCardToken)

### Melhorias:
- Logs mais detalhados para facilitar diagnóstico de problemas
- Reorganização do código para melhor manutenção
- Tratamento individual de cada resposta da API
- Melhor configuração dos headers de requisição

### Testes realizados:
- ✅ Criação de cliente com CPF - Sucesso
- ✅ Busca de cliente por CPF - Sucesso
- ✅ Listagem de clientes - Sucesso
- ✅ Formatação de CPFs variados - Sucesso
- ✅ Tratamento de erros da API - Sucesso

### Problemas conhecidos:
- Nenhum problema conhecido no momento.

## Solução de contorno para erros anteriores:

1. **Erro "O CPF/CNPJ informado é inválido"**:
   - **Causa**: Formatação incorreta do CPF/CNPJ (com pontos, traços, barras)
   - **Solução**: Implementada função de limpeza usando regex `/[^\d]+/g`
   
2. **Erro "The type of person is required"**:
   - **Causa**: Campo personType não enviado na requisição
   - **Solução**: Adicionado valor padrão 'FISICA' quando não especificado

3. **Erro de duplicidade em propriedades**:
   - **Causa**: Interface com propriedades duplicadas
   - **Solução**: Removida duplicidade na definição de interfaces

## Referências:
- [Documentação API Asaas](https://asaasv3.docs.apiary.io/)
- [Endpoint de Clientes](https://asaasv3.docs.apiary.io/#reference/0/clientes)
- [Endpoint de Pagamentos](https://asaasv3.docs.apiary.io/#reference/0/cobrancas)