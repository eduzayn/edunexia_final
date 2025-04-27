import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDiscipline, updateDiscipline, deleteDiscipline } from '../disciplines-controller';
import { db } from '../../db';
import { disciplineTable } from '../../db/schema';

// Mock do banco de dados
vi.mock('../../db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 1, name: 'Disciplina Teste' }])
      }))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: 1, name: 'Disciplina Atualizada' }])
        }))
      }))
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 1, name: 'Disciplina Excluída' }])
      }))
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([{ id: 1, code: 'DISC01', name: 'Disciplina Existente' }])
        }))
      }))
    }))
  }
}));

// Mock para a geração do código da disciplina
vi.mock('../discipline-code-generator', () => ({
  generateDisciplineCode: vi.fn().mockResolvedValue('DISC01'),
  isDisciplineCodeInUse: vi.fn().mockResolvedValue(false)
}));

describe('Disciplinas Controller', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = {
      params: { id: '1' },
      body: {
        name: 'Disciplina Teste',
        description: 'Descrição da disciplina',
        workload: 60,
        syllabus: 'Conteúdo programático'
      },
      user: { role: 'admin' }
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    // Limpa todos os mocks antes de cada teste
    vi.clearAllMocks();
  });

  describe('createDiscipline', () => {
    it('deve criar uma disciplina com sucesso', async () => {
      await createDiscipline(req, res);
      
      // Verifica se o insert foi chamado com os dados corretos
      expect(db.insert).toHaveBeenCalled();
      // Verifica se retornou status 201
      expect(res.status).toHaveBeenCalledWith(201);
      // Verifica se retornou dados da disciplina
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    });

    it('deve retornar erro 400 se faltar campos obrigatórios', async () => {
      req.body = { name: 'Disciplina Incompleta' };
      await createDiscipline(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        success: false,
        message: 'Todos os campos são obrigatórios' 
      }));
    });
  });

  describe('updateDiscipline', () => {
    it('deve atualizar uma disciplina com sucesso', async () => {
      req.body.code = 'DISC01';
      await updateDiscipline(req, res);
      
      expect(db.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    });

    it('deve retornar erro 404 se a disciplina não existir', async () => {
      // Modificando o mock para simular disciplina não encontrada
      vi.mocked(db.select().from().where().limit).mockResolvedValueOnce([]);
      
      await updateDiscipline(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        success: false,
        message: 'Disciplina não encontrada' 
      }));
    });

    it('deve verificar permissões ao alterar o código da disciplina', async () => {
      req.body.code = 'NOVO01';
      req.user.role = 'instructor';
      
      await updateDiscipline(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Apenas administradores podem alterar o código da disciplina'
      }));
    });
  });

  describe('deleteDiscipline', () => {
    it('deve excluir uma disciplina com sucesso', async () => {
      await deleteDiscipline(req, res);
      
      expect(db.delete).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        success: true,
        message: 'Disciplina excluída com sucesso'
      }));
    });

    it('deve retornar erro 404 se a disciplina não existir', async () => {
      // Modificando o mock para simular disciplina não encontrada
      vi.mocked(db.select().from().where().limit).mockResolvedValueOnce([]);
      
      await deleteDiscipline(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        success: false,
        message: 'Disciplina não encontrada' 
      }));
    });
  });
}); 