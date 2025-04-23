import { Request, Response } from 'express';
import { db } from '../db';
import { sql, eq, inArray, and } from 'drizzle-orm';
import { roles, permissions, rolePermissions, userRoles } from '../db/schema';

/**
 * Lista todas as funções disponíveis no sistema
 */
export async function listRoles(req: Request, res: Response) {
  try {
    const rolesList = await db.query.roles.findMany({
      with: {
        permissions: {
          with: {
            permission: true
          }
        }
      }
    });

    // Transformar dados para formato mais amigável
    const formattedRoles = rolesList.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map(rp => rp.permission)
    }));

    res.json(formattedRoles);
  } catch (error: any) {
    console.error("Erro ao listar funções:", error);
    res.status(500).json({ success: false, message: "Erro ao listar funções", error: error.message });
  }
}

/**
 * Obtém detalhes de uma função específica
 */
export async function getRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, parseInt(id, 10)),
      with: {
        permissions: {
          with: {
            permission: true
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({ success: false, message: "Função não encontrada" });
    }

    // Transformar dados para formato mais amigável
    const formattedRole = {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map(rp => rp.permission)
    };

    res.json(formattedRole);
  } catch (error: any) {
    console.error("Erro ao obter função:", error);
    res.status(500).json({ success: false, message: "Erro ao obter função", error: error.message });
  }
}

/**
 * Cria uma nova função
 */
export async function createRole(req: Request, res: Response) {
  try {
    const { name, description, permissions: permissionIds } = req.body;

    // Verificar se já existe uma função com este nome
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.name, name)
    });

    if (existingRole) {
      return res.status(400).json({ success: false, message: "Já existe uma função com este nome" });
    }

    // Inserir nova função
    const [newRole] = await db.insert(roles).values({
      name,
      description,
    }).returning();

    // Se houver permissões, relacioná-las à função
    if (permissionIds && permissionIds.length > 0) {
      const rolePermissionValues = permissionIds.map((permissionId: string) => ({
        roleId: newRole.id,
        permissionId: parseInt(permissionId, 10)
      }));

      await db.insert(rolePermissions).values(rolePermissionValues);
    }

    // Buscar a função completa para retornar
    const createdRole = await db.query.roles.findFirst({
      where: eq(roles.id, newRole.id),
      with: {
        permissions: {
          with: {
            permission: true
          }
        }
      }
    });

    // Transformar dados para formato mais amigável
    const formattedRole = {
      id: createdRole!.id,
      name: createdRole!.name,
      description: createdRole!.description,
      permissions: createdRole!.permissions.map(rp => rp.permission)
    };

    res.status(201).json(formattedRole);
  } catch (error: any) {
    console.error("Erro ao criar função:", error);
    res.status(500).json({ success: false, message: "Erro ao criar função", error: error.message });
  }
}

/**
 * Atualiza uma função existente
 */
export async function updateRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, permissions: permissionIds } = req.body;
    const roleId = parseInt(id, 10);

    // Verificar se a função existe
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.id, roleId)
    });

    if (!existingRole) {
      return res.status(404).json({ success: false, message: "Função não encontrada" });
    }

    // Verificar se já existe outra função com este nome
    const nameConflict = await db.query.roles.findFirst({
      where: and(
        eq(roles.name, name),
        eq(roles.id, roleId).not()
      )
    });

    if (nameConflict) {
      return res.status(400).json({ success: false, message: "Já existe outra função com este nome" });
    }

    // Atualizar a função
    await db.update(roles)
      .set({ name, description })
      .where(eq(roles.id, roleId));

    // Remover todas as permissões existentes
    await db.delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    // Adicionar as novas permissões
    if (permissionIds && permissionIds.length > 0) {
      const rolePermissionValues = permissionIds.map((permissionId: string) => ({
        roleId,
        permissionId: parseInt(permissionId, 10)
      }));

      await db.insert(rolePermissions).values(rolePermissionValues);
    }

    // Buscar a função atualizada
    const updatedRole = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
      with: {
        permissions: {
          with: {
            permission: true
          }
        }
      }
    });

    // Transformar dados para formato mais amigável
    const formattedRole = {
      id: updatedRole!.id,
      name: updatedRole!.name,
      description: updatedRole!.description,
      permissions: updatedRole!.permissions.map(rp => rp.permission)
    };

    res.json(formattedRole);
  } catch (error: any) {
    console.error("Erro ao atualizar função:", error);
    res.status(500).json({ success: false, message: "Erro ao atualizar função", error: error.message });
  }
}

/**
 * Remove uma função
 */
export async function deleteRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const roleId = parseInt(id, 10);

    // Verificar se a função existe
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.id, roleId)
    });

    if (!existingRole) {
      return res.status(404).json({ success: false, message: "Função não encontrada" });
    }

    // Remover as relações de usuários com esta função
    await db.delete(userRoles)
      .where(eq(userRoles.roleId, roleId));

    // Remover as relações com permissões
    await db.delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    // Remover a função
    await db.delete(roles)
      .where(eq(roles.id, roleId));

    res.json({ success: true, message: "Função removida com sucesso" });
  } catch (error: any) {
    console.error("Erro ao remover função:", error);
    res.status(500).json({ success: false, message: "Erro ao remover função", error: error.message });
  }
}

/**
 * Lista todas as permissões disponíveis no sistema
 */
export async function listPermissions(req: Request, res: Response) {
  try {
    const permissionsList = await db.select().from(permissions);
    res.json(permissionsList);
  } catch (error: any) {
    console.error("Erro ao listar permissões:", error);
    res.status(500).json({ success: false, message: "Erro ao listar permissões", error: error.message });
  }
}

/**
 * Obtém as permissões do usuário autenticado
 */
export async function getUserPermissions(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Usuário não autenticado" });
    }

    const userId = req.user.id;

    // Buscar todas as funções do usuário
    const userRolesList = await db.query.userRoles.findMany({
      where: eq(userRoles.userId, userId),
      with: {
        role: {
          with: {
            permissions: {
              with: {
                permission: true
              }
            }
          }
        }
      }
    });

    // Extrair permissões únicas de todas as funções
    const permissionsSet = new Set<number>();
    const permissionsList: any[] = [];

    userRolesList.forEach(userRole => {
      userRole.role.permissions.forEach(rolePermission => {
        const permission = rolePermission.permission;
        if (!permissionsSet.has(permission.id)) {
          permissionsSet.add(permission.id);
          permissionsList.push(permission);
        }
      });
    });

    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
      },
      roles: userRolesList.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description
      })),
      permissions: permissionsList
    });
  } catch (error: any) {
    console.error("Erro ao obter permissões do usuário:", error);
    res.status(500).json({ success: false, message: "Erro ao obter permissões do usuário", error: error.message });
  }
}

/**
 * Lista regras de permissão para fases de instituição (ABAC)
 */
export async function listInstitutionPhaseRules(req: Request, res: Response) {
  try {
    // Simulação de regras ABAC para fases de instituição
    const rules = [
      { id: 1, phase: "implementation", description: "Fase de implementação", permissions: ["create_course", "edit_course"] },
      { id: 2, phase: "active", description: "Fase ativa", permissions: ["view_course", "create_enrollment"] },
      { id: 3, phase: "suspended", description: "Fase suspensa", permissions: ["view_course"] },
    ];
    
    res.json(rules);
  } catch (error: any) {
    console.error("Erro ao listar regras de fase:", error);
    res.status(500).json({ success: false, message: "Erro ao listar regras de fase", error: error.message });
  }
}

/**
 * Lista regras de permissão para status de pagamento (ABAC)
 */
export async function listPaymentStatusRules(req: Request, res: Response) {
  try {
    // Simulação de regras ABAC para status de pagamento
    const rules = [
      { id: 1, status: "pending", description: "Pagamento pendente", permissions: ["view_course"] },
      { id: 2, status: "paid", description: "Pagamento confirmado", permissions: ["view_course", "access_content", "download_material"] },
      { id: 3, status: "overdue", description: "Pagamento atrasado", permissions: ["view_course"] },
      { id: 4, status: "canceled", description: "Pagamento cancelado", permissions: [] },
    ];
    
    res.json(rules);
  } catch (error: any) {
    console.error("Erro ao listar regras de pagamento:", error);
    res.status(500).json({ success: false, message: "Erro ao listar regras de pagamento", error: error.message });
  }
}

/**
 * Lista regras de permissão baseadas em períodos (ABAC)
 */
export async function listPeriodRules(req: Request, res: Response) {
  try {
    // Simulação de regras ABAC para períodos
    const rules = [
      { id: 1, period: "before_start", description: "Antes do início", permissions: ["view_course", "download_syllabus"] },
      { id: 2, period: "during_course", description: "Durante o curso", permissions: ["view_course", "access_content", "submit_assignments"] },
      { id: 3, period: "after_end", description: "Após o término", permissions: ["view_course", "download_certificate"] },
    ];
    
    res.json(rules);
  } catch (error: any) {
    console.error("Erro ao listar regras de período:", error);
    res.status(500).json({ success: false, message: "Erro ao listar regras de período", error: error.message });
  }
}