# Serviços de Integração Asaas - PROTEGIDO

## ⚠️ ATENÇÃO: NÃO MODIFIQUE ESTES ARQUIVOS ⚠️

Esta pasta contém versões protegidas e estáveis dos serviços de integração com a API do Asaas. Estas versões foram testadas e aprovadas para uso em produção.

## Arquivos nesta pasta

1. **asaas-customers-service.ts** - Serviço para gerenciamento de clientes no Asaas
   - Criação, busca e atualização de clientes
   - Formatação correta de CPF/CNPJ (apenas números)
   - Tratamento de erros específicos da API

2. **asaas-direct-payment-service.ts** - Serviço para pagamentos diretos
   - Criação de links de pagamento
   - Criação de cobranças
   - Busca de status de pagamentos

3. **asaas-course-payment-service.ts** - Serviço para pagamentos de cursos
   - Integração com o módulo de cursos
   - Gestão de pagamentos de matrículas

4. **certification-payment-service.ts** - Serviço para pagamentos de certificados
   - Integração com o módulo de certificação
   - Gestão de pagamentos para emissão de certificados

## Recomendações

- Se precisar fazer modificações, **crie uma nova versão** dos arquivos e teste-a separadamente.
- Utilize estes arquivos como referência para implementações futuras.
- Mantenha as práticas de formatação de CPF/CNPJ e tratamento de erros consistentes.

## Detalhes da implementação

### Formatação de CPF/CNPJ
Os documentos são formatados usando a expressão regular `/[^\d]+/g` para remover qualquer caractere não-numérico antes de enviar para a API Asaas.

```typescript
// Exemplo de formatação
cpfCnpj = cpfCnpj.replace(/[^\d]+/g, '');
```

### Tipo de pessoa
O tipo de pessoa (FISICA/JURIDICA) é definido automaticamente se não for fornecido:

```typescript
if (!customerData.personType) {
  customerData.personType = 'FISICA'; // Valor padrão
}
```

### Tratamento de erros
Erros da API são capturados e formatados para facilitar a identificação do problema:

```typescript
if (error.response && error.response.data && error.response.data.errors) {
  const apiErrors = error.response.data.errors;
  errorMessage = apiErrors.map((err) => `${err.description} (${err.code})`).join('; ');
}
```

## Data da última atualização: 23/04/2025