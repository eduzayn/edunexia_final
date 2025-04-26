import { test, expect } from '@playwright/test';

test.describe('API de Disciplinas', () => {
  // Token de autenticação (simulado para testes)
  const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTgsInVzZXJuYW1lIjoiYWRtaW4iLCJmdWxsTmFtZSI6IkFkbWluaXN0cmFkb3IiLCJlbWFpbCI6ImFkbWluQGVkdW5leGEuY29tIiwicG9ydGFsVHlwZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ1Njg4OTE4NTk5LCJleHAiOjE3NDU3NzUzMTh9.fnQVImk3Rm3tRqVQOgYMGIv5xze_YtnN9RKS6RTOKIA';
  
  // URL base para todos os testes
  const baseURL = 'https://d7775755-86d6-46c0-9e80-55092b836808-00-1wokokcfxh045.worf.replit.dev';

  test('deve criar uma nova disciplina via API', async ({ request }) => {
    // Dados para criação da disciplina
    const randomCode = 'API' + Math.floor(Math.random() * 10000);
    const disciplinaData = {
      code: randomCode,
      name: 'Disciplina API Test',
      description: 'Descrição da disciplina criada via API',
      workload: 60,
      syllabus: 'Ementa da disciplina via API'
    };
    
    // Fazer requisição POST para criar disciplina
    const response = await request.post(`${baseURL}/api/disciplines`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: disciplinaData
    });
    
    // Verificar status da resposta
    expect(response.status()).toBe(201);
    
    // Verificar resposta
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('id');
    expect(responseBody.code).toBe(disciplinaData.code);
    expect(responseBody.name).toBe(disciplinaData.name);
    
    // Armazenar o ID para testes subsequentes
    const disciplinaId = responseBody.id;
    
    // Verificar se a disciplina existe consultando via GET
    const getResponse = await request.get(`${baseURL}/api/disciplines/${disciplinaId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    // Verificar status e corpo da resposta GET
    expect(getResponse.status()).toBe(200);
    const getDisciplina = await getResponse.json();
    expect(getDisciplina.id).toBe(disciplinaId);
    expect(getDisciplina.code).toBe(disciplinaData.code);
  });

  test('deve verificar o status de completude de uma disciplina', async ({ request }) => {
    // Criar uma disciplina para o teste
    const randomCode = 'COMP' + Math.floor(Math.random() * 10000);
    const disciplinaData = {
      code: randomCode,
      name: 'Disciplina para Completude',
      description: 'Verificação de completude via API',
      workload: 40,
      syllabus: 'Ementa para teste de completude'
    };
    
    // Criar a disciplina
    const createResponse = await request.post(`${baseURL}/api/disciplines`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: disciplinaData
    });
    
    expect(createResponse.status()).toBe(201);
    const disciplina = await createResponse.json();
    
    // Verificar o status de completude
    const completudeResponse = await request.get(`${baseURL}/api/disciplines/${disciplina.id}/completeness`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    expect(completudeResponse.status()).toBe(200);
    const completudeData = await completudeResponse.json();
    
    // Verificar os dados de completude
    expect(completudeData).toHaveProperty('isComplete');
    expect(completudeData).toHaveProperty('requirements');
    
    // Uma disciplina recém-criada deve estar incompleta
    expect(completudeData.isComplete).toBe(false);
    
    // Verificar requisitos individuais
    expect(completudeData.requirements).toHaveProperty('hasVideo');
    expect(completudeData.requirements).toHaveProperty('hasEbook');
    expect(completudeData.requirements).toHaveProperty('hasSimulado');
    expect(completudeData.requirements).toHaveProperty('hasAvaliacaoFinal');
    
    // Todos os requisitos devem estar incompletos
    expect(completudeData.requirements.hasVideo).toBe(false);
    expect(completudeData.requirements.hasEbook).toBe(false);
    expect(completudeData.requirements.hasSimulado).toBe(false);
    expect(completudeData.requirements.hasAvaliacaoFinal).toBe(false);
  });

  test('deve adicionar conteúdo à disciplina e verificar completude', async ({ request }) => {
    // Criar uma disciplina para o teste
    const randomCode = 'CONT' + Math.floor(Math.random() * 10000);
    const disciplinaData = {
      code: randomCode,
      name: 'Disciplina para Conteúdo',
      description: 'Adição de conteúdo via API',
      workload: 80,
      syllabus: 'Ementa para teste de adição de conteúdo'
    };
    
    // Criar a disciplina
    const createResponse = await request.post(`${baseURL}/api/disciplines`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: disciplinaData
    });
    
    expect(createResponse.status()).toBe(201);
    const disciplina = await createResponse.json();
    const disciplinaId = disciplina.id;
    
    // 1. Adicionar vídeo
    const videoData = {
      title: 'Vídeo de Teste API',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      description: 'Descrição do vídeo de teste via API'
    };
    
    const videoResponse = await request.post(`${baseURL}/api/disciplines/${disciplinaId}/videos`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: videoData
    });
    
    expect(videoResponse.status()).toBe(201);
    
    // 2. Adicionar e-book
    const ebookData = {
      title: 'E-book de Teste API',
      url: 'https://example.com/ebook-api.pdf',
      description: 'Descrição do e-book de teste via API'
    };
    
    const ebookResponse = await request.post(`${baseURL}/api/disciplines/${disciplinaId}/ebooks`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: ebookData
    });
    
    expect(ebookResponse.status()).toBe(201);
    
    // 3. Adicionar questões ao simulado
    // Primeiro, criar o simulado para a disciplina
    const simuladoData = {
      title: 'Simulado de Teste API',
      description: 'Simulado criado via API para testes'
    };
    
    const simuladoResponse = await request.post(`${baseURL}/api/disciplines/${disciplinaId}/simulados`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: simuladoData
    });
    
    expect(simuladoResponse.status()).toBe(201);
    const simulado = await simuladoResponse.json();
    
    // Adicionar 5 questões ao simulado
    for (let i = 1; i <= 5; i++) {
      const questionData = {
        text: `Questão de simulado ${i} via API`,
        options: [
          `Opção A da questão ${i}`,
          `Opção B da questão ${i}`,
          `Opção C da questão ${i}`,
          `Opção D da questão ${i}`
        ],
        correctOption: 0
      };
      
      const questionResponse = await request.post(`${baseURL}/api/simulados/${simulado.id}/questions`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: questionData
      });
      
      expect(questionResponse.status()).toBe(201);
    }
    
    // 4. Adicionar questões à avaliação final
    // Primeiro, criar a avaliação final para a disciplina
    const avaliacaoData = {
      title: 'Avaliação Final de Teste API',
      description: 'Avaliação Final criada via API para testes'
    };
    
    const avaliacaoResponse = await request.post(`${baseURL}/api/disciplines/${disciplinaId}/avaliacoes`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: avaliacaoData
    });
    
    expect(avaliacaoResponse.status()).toBe(201);
    const avaliacao = await avaliacaoResponse.json();
    
    // Adicionar 10 questões à avaliação final
    for (let i = 1; i <= 10; i++) {
      const questionData = {
        text: `Questão de avaliação final ${i} via API`,
        options: [
          `Opção A da questão ${i}`,
          `Opção B da questão ${i}`,
          `Opção C da questão ${i}`,
          `Opção D da questão ${i}`
        ],
        correctOption: 0
      };
      
      const questionResponse = await request.post(`${baseURL}/api/avaliacoes/${avaliacao.id}/questions`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: questionData
      });
      
      expect(questionResponse.status()).toBe(201);
    }
    
    // 5. Verificar o status de completude após adicionar conteúdo
    const completudeResponse = await request.get(`${baseURL}/api/disciplines/${disciplinaId}/completeness`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    expect(completudeResponse.status()).toBe(200);
    const completudeData = await completudeResponse.json();
    
    // Agora a disciplina deve estar completa
    expect(completudeData.isComplete).toBe(true);
    
    // Verificar requisitos individuais
    expect(completudeData.requirements.hasVideo).toBe(true);
    expect(completudeData.requirements.hasEbook).toBe(true);
    expect(completudeData.requirements.hasSimulado).toBe(true);
    expect(completudeData.requirements.hasAvaliacaoFinal).toBe(true);
  });
});