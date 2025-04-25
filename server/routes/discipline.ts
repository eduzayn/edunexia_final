import { Router } from 'express';
import { db } from '../db';
import { 
  disciplines, 
  questions, 
  assessments, 
  assessmentQuestions 
} from '@shared/schema';
import { and, eq, count } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }); // Limite de 10MB

const router = Router();

// Função auxiliar para verificar ID da disciplina
const validateDisciplineId = (id: string): number | null => {
  const numId = parseInt(id, 10);
  return isNaN(numId) ? null : numId;
};

// Função para buscar disciplina por ID
const getDisciplineById = async (id: number) => {
  try {
    const [discipline] = await db
      .select()
      .from(disciplines)
      .where(eq(disciplines.id, id));
    
    return discipline;
  } catch (error) {
    console.error(`Erro ao buscar disciplina ${id}:`, error);
    return null;
  }
};

/**
 * Rota para obter uma disciplina específica pelo ID
 * Retorna os detalhes completos da disciplina incluindo conteúdo
 */
router.get('/api/disciplines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const disciplineId = validateDisciplineId(id);
    
    if (!disciplineId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de disciplina inválido' 
      });
    }
    
    // Buscar a disciplina pelo ID
    const discipline = await getDisciplineById(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ 
        success: false, 
        error: 'Disciplina não encontrada' 
      });
    }
    
    // Retornar os dados da disciplina
    res.json({
      success: true,
      data: discipline
    });
  } catch (error) {
    console.error('Erro ao buscar disciplina:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor ao buscar disciplina' 
    });
  }
});

/**
 * Rota para obter os vídeos de uma disciplina
 */
router.get('/api/disciplines/:id/videos', async (req, res) => {
  try {
    const { id } = req.params;
    const disciplineId = validateDisciplineId(id);
    
    if (!disciplineId) {
      return res.status(400).json({ success: false, error: 'ID de disciplina inválido' });
    }
    
    const discipline = await getDisciplineById(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ success: false, error: 'Disciplina não encontrada' });
    }
    
    // Extrair dados de vídeo da disciplina
    const videos = [];
    
    for (let i = 1; i <= 10; i++) {
      const urlKey = `videoAula${i}Url` as keyof typeof discipline;
      const sourceKey = `videoAula${i}Source` as keyof typeof discipline;
      const startTimeKey = `videoAula${i}StartTime` as keyof typeof discipline;
      
      if (discipline[urlKey]) {
        videos.push({
          id: i,
          url: discipline[urlKey],
          source: discipline[sourceKey],
          startTime: discipline[startTimeKey],
          title: `Aula ${i}: ${discipline.name}`
        });
      }
    }
    
    res.json(videos);
  } catch (error) {
    console.error('Erro ao buscar vídeos da disciplina:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * Rota para adicionar vídeo a uma disciplina
 */
router.post('/api/disciplines/:id/videos', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, videoSource, url, duration, startTime } = req.body;
    
    // Validar ID da disciplina
    const disciplineId = validateDisciplineId(id);
    if (!disciplineId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de disciplina inválido' 
      });
    }
    
    // Validar dados da requisição
    if (!title || !videoSource || !url) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dados incompletos. Título, fonte de vídeo e URL são obrigatórios' 
      });
    }
    
    // Buscar a disciplina
    const discipline = await getDisciplineById(disciplineId);
    if (!discipline) {
      return res.status(404).json({ 
        success: false, 
        error: 'Disciplina não encontrada' 
      });
    }
    
    // Verificar qual slot de vídeo está disponível
    let nextSlot = 0;
    for (let i = 1; i <= 10; i++) {
      const urlKey = `videoAula${i}Url` as keyof typeof discipline;
      if (!discipline[urlKey]) {
        nextSlot = i;
        break;
      }
    }
    
    if (nextSlot === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Esta disciplina já possui o número máximo de vídeos (10)' 
      });
    }
    
    // Atualizar a disciplina com o novo vídeo
    const urlKey = `videoAula${nextSlot}Url`;
    const sourceKey = `videoAula${nextSlot}Source`;
    const startTimeKey = `videoAula${nextSlot}StartTime`;
    
    const [updatedDiscipline] = await db.update(disciplines)
      .set({ 
        [urlKey]: url,
        [sourceKey]: videoSource,
        [startTimeKey]: startTime || null,
        updatedAt: new Date()
      })
      .where(eq(disciplines.id, disciplineId))
      .returning();
    
    if (!updatedDiscipline) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao atualizar disciplina' 
      });
    }
    
    // Retornar sucesso
    return res.status(200).json({ 
      success: true, 
      message: 'Vídeo adicionado com sucesso',
      video: {
        id: nextSlot,
        title,
        url,
        videoSource,
        startTime,
        duration
      }
    });
  } catch (error) {
    console.error('Erro ao adicionar vídeo:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor ao adicionar vídeo'
    });
  }
});

/**
 * Rota para obter material de uma disciplina
 */
router.get('/api/disciplines/:id/material', async (req, res) => {
  try {
    const { id } = req.params;
    const disciplineId = validateDisciplineId(id);
    
    if (!disciplineId) {
      return res.status(400).json({ success: false, error: 'ID de disciplina inválido' });
    }
    
    const discipline = await getDisciplineById(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ success: false, error: 'Disciplina não encontrada' });
    }
    
    // Retornar informações sobre material
    res.json({
      id: disciplineId,
      apostilaPdfUrl: discipline.apostilaPdfUrl,
      title: discipline.name,
      description: discipline.description,
      url: discipline.apostilaPdfUrl,
      name: discipline.name
    });
  } catch (error) {
    console.error('Erro ao buscar material da disciplina:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * Rota para adicionar ou atualizar material (apostila) de uma disciplina
 */
router.post('/api/disciplines/:id/material', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const disciplineId = validateDisciplineId(id);
    
    if (!disciplineId) {
      return res.status(400).json({ success: false, error: 'ID de disciplina inválido' });
    }
    
    const discipline = await getDisciplineById(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ success: false, error: 'Disciplina não encontrada' });
    }

    const { title, description, url } = req.body;
    
    // Verificar se tem arquivo uploaded ou URL
    let fileUrl = url;
    
    // Se tem arquivo, fazer upload e obter URL
    if (req.file) {
      // Aqui você implementaria a lógica de upload do arquivo
      // Para este exemplo, vamos apenas simular que salvamos e temos uma URL
      fileUrl = `/uploads/${req.file.filename}`;
    }
    
    if (!fileUrl && !req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'É necessário fornecer um arquivo ou uma URL para a apostila' 
      });
    }

    // Atualizar disciplina com a apostila
    await db.update(disciplines)
      .set({ 
        apostilaPdfUrl: fileUrl
      })
      .where(eq(disciplines.id, disciplineId));
    
    res.status(200).json({ 
      success: true, 
      message: 'Apostila adicionada com sucesso',
      data: {
        id: disciplineId,
        title,
        description,
        url: fileUrl
      }
    });
    
  } catch (error) {
    console.error('Erro ao adicionar material à disciplina:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * Rota para excluir material (apostila) de uma disciplina
 */
router.delete('/api/disciplines/:id/material', async (req, res) => {
  try {
    const { id } = req.params;
    const disciplineId = validateDisciplineId(id);
    
    if (!disciplineId) {
      return res.status(400).json({ success: false, error: 'ID de disciplina inválido' });
    }
    
    const discipline = await getDisciplineById(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ success: false, error: 'Disciplina não encontrada' });
    }

    // Atualizar disciplina removendo a apostila
    await db.update(disciplines)
      .set({ 
        apostilaPdfUrl: null
      })
      .where(eq(disciplines.id, disciplineId));
    
    res.status(200).json({ 
      success: true, 
      message: 'Apostila removida com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao excluir material da disciplina:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * Rota para adicionar ou atualizar ebook de uma disciplina
 */
router.post('/api/disciplines/:id/ebook', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const disciplineId = validateDisciplineId(id);
    
    if (!disciplineId) {
      return res.status(400).json({ success: false, error: 'ID de disciplina inválido' });
    }
    
    const discipline = await getDisciplineById(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ success: false, error: 'Disciplina não encontrada' });
    }

    const { title, description, url } = req.body;
    
    // Verificar se tem arquivo uploaded ou URL
    let fileUrl = url;
    
    // Se tem arquivo, fazer upload e obter URL
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }
    
    if (!fileUrl && !req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'É necessário fornecer um arquivo ou uma URL para o e-book' 
      });
    }

    // Atualizar disciplina com o e-book
    await db.update(disciplines)
      .set({ 
        ebookInterativoUrl: fileUrl,
        updatedAt: new Date()
      })
      .where(eq(disciplines.id, disciplineId));
    
    res.status(200).json({ 
      success: true, 
      message: 'E-book adicionado com sucesso',
      data: {
        id: disciplineId,
        title: title || discipline.name,
        description: description || discipline.description,
        url: fileUrl
      }
    });
    
  } catch (error) {
    console.error('Erro ao adicionar e-book à disciplina:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * Rota para excluir ebook de uma disciplina
 */
router.delete('/api/disciplines/:id/ebook', async (req, res) => {
  try {
    const { id } = req.params;
    const disciplineId = validateDisciplineId(id);
    
    if (!disciplineId) {
      return res.status(400).json({ success: false, error: 'ID de disciplina inválido' });
    }
    
    const discipline = await getDisciplineById(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ success: false, error: 'Disciplina não encontrada' });
    }

    // Atualizar disciplina removendo o e-book
    await db.update(disciplines)
      .set({ 
        ebookInterativoUrl: null
      })
      .where(eq(disciplines.id, disciplineId));
    
    res.status(200).json({ 
      success: true, 
      message: 'E-book removido com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao excluir e-book da disciplina:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * Rota para obter ebook de uma disciplina
 */
router.get('/api/disciplines/:id/ebook', async (req, res) => {
  try {
    const { id } = req.params;
    const disciplineId = validateDisciplineId(id);
    
    if (!disciplineId) {
      return res.status(400).json({ success: false, error: 'ID de disciplina inválido' });
    }
    
    const discipline = await getDisciplineById(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ success: false, error: 'Disciplina não encontrada' });
    }
    
    // Verificar se existe um ebook real ou uma apostila
    const ebookUrl = discipline.ebookInterativoUrl || discipline.apostilaPdfUrl;
    
    // Se não tiver conteúdo real, retornamos uma estrutura indicando que não há ebook
    if (!ebookUrl) {
      return res.json({
        id: disciplineId,
        available: false,
        name: discipline.name,
        description: discipline.description,
        message: 'Nenhum e-book disponível para esta disciplina.'
      });
    }
    
    // Retornar informações sobre ebook com indicação de que está disponível
    res.json({
      id: disciplineId,
      available: true,
      ebookPdfUrl: ebookUrl,
      name: discipline.name,
      description: discipline.description
    });
  } catch (error) {
    console.error('Erro ao buscar ebook da disciplina:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * Rota para obter questões/simulado de uma disciplina
 */
router.get('/api/disciplines/:id/questions', async (req, res) => {
  try {
    const { id } = req.params;
    const disciplineId = validateDisciplineId(id);
    
    if (!disciplineId) {
      return res.status(400).json({ success: false, error: 'ID de disciplina inválido' });
    }
    
    // Verificar se a disciplina existe
    const discipline = await getDisciplineById(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ success: false, error: 'Disciplina não encontrada' });
    }
    
    // Buscar questões da disciplina no banco
    const disciplineQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.disciplineId, disciplineId));
    
    // Retornar as questões
    res.json(disciplineQuestions || []);
  } catch (error) {
    console.error('Erro ao buscar questões da disciplina:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * Rota para adicionar questão
 */
router.post('/admin/questions', async (req, res) => {
  try {
    const { 
      disciplineId, 
      statement, 
      options, 
      correctOption, 
      explanation 
    } = req.body;
    
    if (!disciplineId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID da disciplina é obrigatório' 
      });
    }
    
    // Validar o ID da disciplina
    const numDisciplineId = parseInt(disciplineId.toString(), 10);
    if (isNaN(numDisciplineId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de disciplina inválido' 
      });
    }
    
    // Verificar se a disciplina existe
    const discipline = await getDisciplineById(numDisciplineId);
    if (!discipline) {
      return res.status(404).json({ 
        success: false, 
        error: 'Disciplina não encontrada' 
      });
    }
    
    // Validar dados da requisição
    if (!statement) {
      return res.status(400).json({ 
        success: false, 
        error: 'Enunciado da questão é obrigatório' 
      });
    }
    
    if (!options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'É necessário fornecer pelo menos 2 opções de resposta' 
      });
    }
    
    if (correctOption === undefined || correctOption === null || correctOption < 0 || correctOption >= options.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'Opção correta inválida' 
      });
    }
    
    // Verificar se options é um array
    let optionsArray = options;
    if (!Array.isArray(optionsArray)) {
      try {
        // Tentar converter caso não seja um array (pode estar vindo como JSON string)
        if (typeof options === 'string') {
          optionsArray = JSON.parse(options);
        } else {
          optionsArray = [];
        }
      } catch (e) {
        console.error('Erro ao converter options:', e);
        optionsArray = [];
      }
    }

    // Inserir a questão no banco de dados
    const [newQuestion] = await db
      .insert(questions)
      .values({
        disciplineId: numDisciplineId,
        statement,
        options: optionsArray,
        correctOption,
        explanation: explanation || null,
        questionType: 'multiple_choice',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    if (!newQuestion) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao criar questão' 
      });
    }
    
    // Retornar a questão criada
    return res.status(201).json({ 
      success: true, 
      message: 'Questão criada com sucesso',
      question: newQuestion
    });
    
  } catch (error) {
    console.error('Erro ao criar questão:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor ao criar questão' 
    });
  }
});

/**
 * Rota para obter avaliações de uma disciplina
 */
router.get('/api/disciplines/:id/assessments', async (req, res) => {
  try {
    const { id } = req.params;
    const disciplineId = validateDisciplineId(id);
    
    if (!disciplineId) {
      return res.status(400).json({ success: false, error: 'ID de disciplina inválido' });
    }
    
    // Verificar se a disciplina existe
    const discipline = await getDisciplineById(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ success: false, error: 'Disciplina não encontrada' });
    }
    
    // Buscar avaliações da disciplina no banco
    const disciplineAssessments = await db
      .select()
      .from(assessments)
      .where(eq(assessments.disciplineId, disciplineId));
    
    // Para cada avaliação, calcular quantas questões ela possui
    // e outras informações relevantes
    const assessmentsWithQuestionCount = await Promise.all(
      disciplineAssessments.map(async (assessment) => {
        // Contar questões da avaliação
        const questionCount = await db
          .select({ count: count() })
          .from(assessmentQuestions)
          .where(eq(assessmentQuestions.assessmentId, assessment.id))
          .then(result => result[0]?.count || 0);
        
        return {
          ...assessment,
          questionCount
        };
      })
    );
    
    // Retornar as avaliações
    res.json(assessmentsWithQuestionCount || []);
  } catch (error) {
    console.error('Erro ao buscar avaliações da disciplina:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * Rota para adicionar uma avaliação (simulado ou avaliação final)
 */
router.post('/admin/assessments', async (req, res) => {
  try {
    const { 
      disciplineId, 
      title, 
      description, 
      type, 
      passingScore 
    } = req.body;
    
    if (!disciplineId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID da disciplina é obrigatório' 
      });
    }
    
    // Validar o ID da disciplina
    const numDisciplineId = parseInt(disciplineId.toString(), 10);
    if (isNaN(numDisciplineId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de disciplina inválido' 
      });
    }
    
    // Verificar se a disciplina existe
    const discipline = await getDisciplineById(numDisciplineId);
    if (!discipline) {
      return res.status(404).json({ 
        success: false, 
        error: 'Disciplina não encontrada' 
      });
    }
    
    // Validar dados da requisição
    if (!title) {
      return res.status(400).json({ 
        success: false, 
        error: 'Título da avaliação é obrigatório' 
      });
    }
    
    if (!type || (type !== 'simulado' && type !== 'avaliacao_final')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tipo de avaliação inválido. Deve ser simulado ou avaliacao_final' 
      });
    }
    
    // Verificar se já existe uma avaliação do mesmo tipo para esta disciplina
    const existingAssessment = await db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.disciplineId, numDisciplineId),
          eq(assessments.type, type)
        )
      )
      .limit(1);
    
    if (existingAssessment.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Já existe um(a) ${type === 'simulado' ? 'simulado' : 'avaliação final'} para esta disciplina` 
      });
    }
    
    // Converter passingScore para número
    let numPassingScore = 60; // Valor padrão
    if (passingScore !== undefined && passingScore !== null) {
      numPassingScore = typeof passingScore === 'number' 
        ? passingScore 
        : parseInt(passingScore.toString(), 10);
      
      if (isNaN(numPassingScore) || numPassingScore < 0 || numPassingScore > 100) {
        numPassingScore = 60; // Valor padrão se inválido
      }
    }
    
    // Inserir a avaliação no banco de dados
    const [newAssessment] = await db
      .insert(assessments)
      .values({
        disciplineId: numDisciplineId,
        title,
        description: description || null,
        type,
        passingScore: numPassingScore,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    if (!newAssessment) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao criar avaliação' 
      });
    }
    
    // Retornar a avaliação criada
    return res.status(201).json({ 
      success: true, 
      message: 'Avaliação criada com sucesso',
      assessment: {
        ...newAssessment,
        questionCount: 0 // Inicialmente não tem questões
      }
    });
    
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor ao criar avaliação' 
    });
  }
});

/**
 * Rota para editar vídeo de uma disciplina
 */
router.put('/admin/discipline-videos/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { title, description, videoSource, url, duration, startTime, disciplineId } = req.body;
    
    // Validar ID da disciplina
    const numDisciplineId = validateDisciplineId(disciplineId?.toString());
    if (!numDisciplineId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de disciplina inválido' 
      });
    }
    
    // Validar ID do vídeo
    const numVideoId = parseInt(videoId, 10);
    if (isNaN(numVideoId) || numVideoId < 1 || numVideoId > 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de vídeo inválido. Deve ser um número entre 1 e 10' 
      });
    }
    
    // Validar dados da requisição
    if (!title || !videoSource || !url) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dados incompletos. Título, fonte de vídeo e URL são obrigatórios' 
      });
    }
    
    // Buscar a disciplina
    const discipline = await getDisciplineById(numDisciplineId);
    if (!discipline) {
      return res.status(404).json({ 
        success: false, 
        error: 'Disciplina não encontrada' 
      });
    }
    
    // Atualizar a disciplina com o vídeo editado
    const urlKey = `videoAula${numVideoId}Url`;
    const sourceKey = `videoAula${numVideoId}Source`;
    const startTimeKey = `videoAula${numVideoId}StartTime`;
    
    const [updatedDiscipline] = await db.update(disciplines)
      .set({ 
        [urlKey]: url,
        [sourceKey]: videoSource,
        [startTimeKey]: startTime || null,
        updatedAt: new Date()
      })
      .where(eq(disciplines.id, numDisciplineId))
      .returning();
    
    if (!updatedDiscipline) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao atualizar disciplina' 
      });
    }
    
    // Retornar sucesso
    return res.status(200).json({ 
      success: true, 
      message: 'Vídeo atualizado com sucesso',
      video: {
        id: numVideoId,
        title,
        url,
        videoSource,
        startTime,
        duration
      }
    });
  } catch (error) {
    console.error('Erro ao editar vídeo:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor ao editar vídeo'
    });
  }
});

/**
 * Rota para excluir vídeo de uma disciplina
 */
router.delete('/admin/discipline-videos/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { disciplineId } = req.query;
    
    // Validar ID da disciplina
    if (!disciplineId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de disciplina é obrigatório' 
      });
    }
    
    const disciplineIdStr = Array.isArray(disciplineId) ? disciplineId[0] : disciplineId;
    const numDisciplineId = validateDisciplineId(disciplineIdStr && typeof disciplineIdStr === 'object' ? String(disciplineIdStr) : String(disciplineIdStr));
    
    if (!numDisciplineId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de disciplina inválido' 
      });
    }
    
    // Validar ID do vídeo
    const numVideoId = parseInt(videoId, 10);
    if (isNaN(numVideoId) || numVideoId < 1 || numVideoId > 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de vídeo inválido. Deve ser um número entre 1 e 10' 
      });
    }
    
    // Buscar a disciplina
    const discipline = await getDisciplineById(numDisciplineId);
    if (!discipline) {
      return res.status(404).json({ 
        success: false, 
        error: 'Disciplina não encontrada' 
      });
    }
    
    // Remover o vídeo da disciplina (definindo os campos como null)
    const urlKey = `videoAula${numVideoId}Url`;
    const sourceKey = `videoAula${numVideoId}Source`;
    const startTimeKey = `videoAula${numVideoId}StartTime`;
    
    const [updatedDiscipline] = await db.update(disciplines)
      .set({ 
        [urlKey]: null,
        [sourceKey]: null,
        [startTimeKey]: null,
        updatedAt: new Date()
      })
      .where(eq(disciplines.id, numDisciplineId))
      .returning();
    
    if (!updatedDiscipline) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao excluir vídeo da disciplina' 
      });
    }
    
    // Retornar sucesso
    return res.status(200).json({ 
      success: true, 
      message: 'Vídeo excluído com sucesso',
      videoId: numVideoId
    });
  } catch (error) {
    console.error('Erro ao excluir vídeo:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// Endpoints para E-book Interativo
// GET - Obter e-book interativo de uma disciplina
router.get('/:disciplineId/interactive-ebook', async (req, res) => {
  try {
    const { disciplineId } = req.params;
    const numDisciplineId = validateDisciplineId(disciplineId);
    
    if (!numDisciplineId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID da disciplina inválido' 
      });
    }
    
    // Como este é um recurso novo, retornamos um objeto indicando que não há e-book interativo
    // Isso é apenas uma implementação temporária até que o schema seja atualizado
    return res.status(200).json({ 
      id: numDisciplineId,
      available: false,
      message: "E-book interativo ainda não configurado"
    });
  } catch (error) {
    console.error('Erro ao obter e-book interativo:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// POST - Adicionar ou atualizar e-book interativo
router.post('/:disciplineId/interactive-ebook', upload.single('file'), async (req, res) => {
  try {
    const { disciplineId } = req.params;
    const numDisciplineId = validateDisciplineId(disciplineId);
    
    if (!numDisciplineId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID da disciplina inválido' 
      });
    }
    
    // Dados do formulário
    const { title, description, url } = req.body;
    const file = req.file;
    
    // Verificar se foi enviado arquivo ou URL
    if (!file && !url) {
      return res.status(400).json({
        success: false,
        error: 'É necessário fornecer um arquivo ou uma URL'
      });
    }
    
    // Simular sucesso - isso seria substituído por código real que salva os dados
    return res.status(200).json({
      success: true,
      message: 'E-book interativo adicionado/atualizado com sucesso',
      id: numDisciplineId,
      available: true,
      name: title || "E-book Interativo",
      description: description || "",
      interactiveEbookUrl: file ? 
        `${req.protocol}://${req.get('host')}/uploads/${file.filename}` : 
        url
    });
  } catch (error) {
    console.error('Erro ao adicionar e-book interativo:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// DELETE - Remover e-book interativo
router.delete('/:disciplineId/interactive-ebook', async (req, res) => {
  try {
    const { disciplineId } = req.params;
    const numDisciplineId = validateDisciplineId(disciplineId);
    
    if (!numDisciplineId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID da disciplina inválido' 
      });
    }
    
    // Simular sucesso - seria substituído por código real
    return res.status(200).json({
      success: true,
      message: 'E-book interativo removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover e-book interativo:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

export default router;