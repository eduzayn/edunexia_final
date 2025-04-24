import fetch from 'node-fetch';

async function testMatricula() {
  try {
    console.log("1. Iniciando teste de matrícula");
    
    // 1. Login para obter o token
    console.log("\n2. Fazendo login para obter o token");
    const loginResponse = await fetch('http://localhost:5000/api-json/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'Admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log("Status do login:", loginResponse.status);
    console.log("Token obtido:", loginData.token ? "Sim" : "Não");
    
    if (!loginData.token) {
      console.error("Falha ao obter token:", loginData);
      return;
    }
    
    const token = loginData.token;
    
    // 2. Buscar cursos disponíveis para testar o preenchimento automático do valor
    console.log("\n3. Buscando cursos disponíveis");
    const coursesResponse = await fetch('http://localhost:5000/api-json/courses', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const coursesData = await coursesResponse.json();
    console.log("Status da busca de cursos:", coursesResponse.status);
    console.log("Número de cursos encontrados:", coursesData.data ? coursesData.data.length : 0);
    
    if (!coursesData.data || coursesData.data.length === 0) {
      console.error("Nenhum curso encontrado para testar");
      return;
    }
    
    // Selecionar um curso que tenha preço definido
    const selectedCourse = coursesData.data.find(course => course.price);
    
    if (!selectedCourse) {
      console.error("Nenhum curso com preço definido encontrado");
      return;
    }
    
    console.log("\nCurso selecionado para teste:");
    console.log("ID:", selectedCourse.id);
    console.log("Nome:", selectedCourse.name);
    console.log("Preço:", selectedCourse.price);
    
    // 3. Buscar instituições
    console.log("\n4. Buscando instituições disponíveis");
    const institutionsResponse = await fetch('http://localhost:5000/api-json/institutions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const institutionsData = await institutionsResponse.json();
    console.log("Status da busca de instituições:", institutionsResponse.status);
    console.log("Número de instituições encontradas:", institutionsData.data ? institutionsData.data.length : 0);
    
    if (!institutionsData.data || institutionsData.data.length === 0) {
      console.error("Nenhuma instituição encontrada para testar");
      return;
    }
    
    const selectedInstitution = institutionsData.data[0];
    
    console.log("\nInstituição selecionada para teste:");
    console.log("ID:", selectedInstitution.id);
    console.log("Nome:", selectedInstitution.name);
    
    // 4. Criando uma matrícula de teste
    console.log("\n5. Criando uma matrícula de teste");
    
    const enrollmentData = {
      studentName: "Aluno Teste E2E",
      studentEmail: "teste-e2e@teste.com",
      studentCpf: "123.456.789-00",
      studentPhone: "(11) 99999-9999",
      courseId: selectedCourse.id,
      institutionId: selectedInstitution.id,
      amount: selectedCourse.price.toString().replace('.', ','),
      billingType: "BOLETO",
      allowInstallments: true,
      maxInstallmentCount: 12,
      dueDateLimitDays: 30
    };
    
    console.log("Dados da matrícula:", JSON.stringify(enrollmentData, null, 2));
    
    const enrollmentResponse = await fetch('http://localhost:5000/api/v2/simplified-enrollments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(enrollmentData)
    });
    
    try {
      const enrollmentResult = await enrollmentResponse.json();
      console.log("\nStatus da criação da matrícula:", enrollmentResponse.status);
      console.log("Resultado:", JSON.stringify(enrollmentResult, null, 2));
      
      if (enrollmentResponse.status === 201 || enrollmentResponse.status === 200) {
        console.log("\n✅ Teste concluído com sucesso! A matrícula foi criada.");
      } else {
        console.log("\n❌ Falha na criação da matrícula.");
      }
    } catch (e) {
      console.error("\nErro ao processar resposta da matrícula:", e);
      console.log("Status HTTP:", enrollmentResponse.status);
      console.log("Texto da resposta:", await enrollmentResponse.text());
    }
    
  } catch (error) {
    console.error("Erro durante o teste:", error);
  }
}

// Executar o teste
testMatricula();