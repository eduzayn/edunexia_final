#!/bin/bash

# Executar testes com Jest
echo "Executando testes de API com Jest..."
npx jest tests/api/disciplinas.test.ts --verbose

# Verificar se os testes passaram
if [ $? -eq 0 ]; then
  echo -e "\n✅ Todos os testes passaram com sucesso!"
else
  echo -e "\n❌ Alguns testes falharam. Verifique os logs acima."
fi