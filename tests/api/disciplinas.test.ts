import request from 'supertest';

const baseURL = 'https://d7775755-86d6-46c0-9e80-55092b836808-00-1wokokcfxh045.worf.replit.dev';
const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTgsInVzZXJuYW1lIjoiYWRtaW4iLCJmdWxsTmFtZSI6IkFkbWluaXN0cmFkb3IiLCJlbWFpbCI6ImFkbWluQGVkdW5leGEuY29tIiwicG9ydGFsVHlwZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ1Njg4OTE4NTk5LCJleHAiOjE3NDU3NzUzMTh9.fnQVImk3Rm3tRqVQOgYMGIv5xze_YtnN9RKS6RTOKIA';

describe('API de Disciplinas', () => {
  let disciplinaId: number;
  
  // Teste de criação de disciplina
  it('deve criar uma nova disciplina via API', async () => {
    // Dados para criação da disciplina
    const randomCode = 'JEST' + Math.floor(Math.random() * 10000);
    const disciplinaData = {
      code: randomCode,
      name: 'Disciplina Jest Test',
      description: 'Descrição da disciplina criada via Jest',
      workload: 60,
      syllabus: 'Ementa da disciplina via Jest'
    };
    
    // Fazer requisição POST para criar disciplina
    const response = await request(baseURL)
      .post('/api/disciplines')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Content-Type', 'application/json')
      .send(disciplinaData);
    
    // Verificar status da resposta
    expect(response.status).toBe(201);
    
    // Verificar resposta
    expect(response.body).toHaveProperty('id');
    expect(response.body.code).toBe(disciplinaData.code);
    expect(response.body.name).toBe(disciplinaData.name);
    
    // Armazenar o ID para testes subsequentes
    disciplinaId = response.body.id;
    
    // Verificar se a disciplina existe consultando via GET
    const getResponse = await request(baseURL)
      .get(`/api/disciplines/${disciplinaId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    // Verificar status e corpo da resposta GET
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(disciplinaId);
    expect(getResponse.body.code).toBe(disciplinaData.code);
  });

  // Teste de verificação de completude
  it('deve verificar o status de completude de uma disciplina', async () => {
    // Criar uma disciplina para o teste
    const randomCode = 'COMP' + Math.floor(Math.random() * 10000);
    const disciplinaData = {
      code: randomCode,
      name: 'Disciplina para Completude',
      description: 'Verificação de completude via Jest',
      workload: 40,
      syllabus: 'Ementa para teste de completude'
    };
    
    // Criar a disciplina
    const createResponse = await request(baseURL)
      .post('/api/disciplines')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Content-Type', 'application/json')
      .send(disciplinaData);
    
    expect(createResponse.status).toBe(201);
    const disciplina = createResponse.body;
    
    // Verificar o status de completude
    const completudeResponse = await request(baseURL)
      .get(`/api/disciplines/${disciplina.id}/completeness`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(completudeResponse.status).toBe(200);
    const completudeData = completudeResponse.body;
    
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

  // Teste completo do fluxo de adição de conteúdo
  it('deve adicionar conteúdo à disciplina e verificar completude', async () => {
    // Criar uma disciplina para o teste
    const randomCode = 'CONT' + Math.floor(Math.random() * 10000);
    const disciplinaData = {
      code: randomCode,
      name: 'Disciplina para Conteúdo',
      description: 'Adição de conteúdo via Jest',
      workload: 80,
      syllabus: 'Ementa para teste de adição de conteúdo'
    };
    
    // Criar a disciplina
    const createResponse = await request(baseURL)
      .post('/api/disciplines')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Content-Type', 'application/json')
      .send(disciplinaData);
    
    expect(createResponse.status).toBe(201);
    const disciplina = createResponse.body;
    const disciplinaId = disciplina.id;
    
    // 1. Adicionar vídeo
    const videoData = {
      title: 'Vídeo de Teste Jest',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      description: 'Descrição do vídeo de teste via Jest'
    };
    
    const videoResponse = await request(baseURL)
      .post(`/api/disciplines/${disciplinaId}/videos`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('Content-Type', 'application/json')
      .send(videoData);
    
    expect(videoResponse.status).toBe(201);
    
    // 2. Adicionar e-book
    const ebookData = {
      title: 'E-book de Teste Jest',
      url: 'https://example.com/ebook-jest.pdf',
      description: 'Descrição do e-book de teste via Jest'
    };
    
    const ebookResponse = await request(baseURL)
      .post(`/api/disciplines/${disciplinaId}/ebooks`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('Content-Type', 'application/json')
      .send(ebookData);
    
    expect(ebookResponse.status).toBe(201);
    
    // 3. Adicionar questões ao simulado
    // Primeiro, criar o simulado para a disciplina
    const simuladoData = {
      title: 'Simulado de Teste Jest',
      description: 'Simulado criado via Jest para testes'
    };
    
    const simuladoResponse = await request(baseURL)
      .post(`/api/disciplines/${disciplinaId}/simulados`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('Content-Type', 'application/json')
      .send(simuladoData);
    
    expect(simuladoResponse.status).toBe(201);
    const simulado = simuladoResponse.body;
    
    // Adicionar 5 questões ao simulado
    for (let i = 1; i <= 5; i++) {
      const questionData = {
        text: `Questão de simulado ${i} via Jest`,
        options: [
          `Opção A da questão ${i}`,
          `Opção B da questão ${i}`,
          `Opção C da questão ${i}`,
          `Opção D da questão ${i}`
        ],
        correctOption: 0
      };
      
      const questionResponse = await request(baseURL)
        .post(`/api/simulados/${simulado.id}/questions`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send(questionData);
      
      expect(questionResponse.status).toBe(201);
    }
    
    // 4. Adicionar questões à avaliação final
    // Primeiro, criar a avaliação final para a disciplina
    const avaliacaoData = {
      title: 'Avaliação Final de Teste Jest',
      description: 'Avaliação Final criada via Jest para testes'
    };
    
    const avaliacaoResponse = await request(baseURL)
      .post(`/api/disciplines/${disciplinaId}/avaliacoes`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('Content-Type', 'application/json')
      .send(avaliacaoData);
    
    expect(avaliacaoResponse.status).toBe(201);
    const avaliacao = avaliacaoResponse.body;
    
    // Adicionar 10 questões à avaliação final
    for (let i = 1; i <= 10; i++) {
      const questionData = {
        text: `Questão de avaliação final ${i} via Jest`,
        options: [
          `Opção A da questão ${i}`,
          `Opção B da questão ${i}`,
          `Opção C da questão ${i}`,
          `Opção D da questão ${i}`
        ],
        correctOption: 0
      };
      
      const questionResponse = await request(baseURL)
        .post(`/api/avaliacoes/${avaliacao.id}/questions`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send(questionData);
      
      expect(questionResponse.status).toBe(201);
    }
    
    // 5. Verificar o status de completude após adicionar conteúdo
    const completudeResponse = await request(baseURL)
      .get(`/api/disciplines/${disciplinaId}/completeness`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(completudeResponse.status).toBe(200);
    const completudeData = completudeResponse.body;
    
    // Agora a disciplina deve estar completa
    expect(completudeData.isComplete).toBe(true);
    
    // Verificar requisitos individuais
    expect(completudeData.requirements.hasVideo).toBe(true);
    expect(completudeData.requirements.hasEbook).toBe(true);
    expect(completudeData.requirements.hasSimulado).toBe(true);
    expect(completudeData.requirements.hasAvaliacaoFinal).toBe(true);
  });
});