/**
 * AUTENTICAÇÃO SIMPLES PARA EMERGÊNCIAS
 * 
 * Este módulo implementa rotas de autenticação de emergência simples
 * que substituem completamente o sistema de autenticação existente
 * para permitir acesso ao sistema em situações críticas.
 */

import express from 'express';
import { Express } from "express";
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export function setupSimpleAuth(app: Express) {
  // Rota para autenticação de emergência
  app.post('/api-json/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      console.log('🚨 AUTENTICAÇÃO DE EMERGÊNCIA: Tentativa de login para', username);
      
      // Buscar o usuário no banco de dados para obter informações completas
      const [userFromDb] = await db.select().from(users).where(eq(users.username, username));
      
      // ⚠️ MODO INSEGURO: Aceitar qualquer usuário que exista no banco de dados
      // ⚠️ Implementação temporária para recuperação de acesso ao sistema
      if (username) {
        console.log('🚨 AUTENTICAÇÃO DE EMERGÊNCIA: Credenciais fornecidas');
        
        let user;
        
        // Se o usuário existe no banco de dados, use seus dados reais
        if (userFromDb) {
          console.log('🚨 AUTENTICAÇÃO DE EMERGÊNCIA: Usuário encontrado no banco de dados');
          console.log('🚨 IGNORANDO VERIFICAÇÃO DE SENHA PARA ACESSO EMERGENCIAL');
          user = userFromDb;
        } else {
          console.log('🚨 AUTENTICAÇÃO DE EMERGÊNCIA: Usuário não encontrado no banco de dados');
          // Se não encontrar o usuário, retorne erro
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Configurar a sessão manualmente - isso é uma simplificação extrema!
        if (!req.session) {
          req.session = {} as any;
        }
        
        req.session.user = user;
        req.session.authenticated = true;
        
        console.log('✅ AUTENTICAÇÃO DE EMERGÊNCIA: Login bem-sucedido para', username);
        
        // Remover a senha antes de retornar ao cliente
        const { password: _, ...userWithoutPassword } = user;
        
        return res.status(200).json(userWithoutPassword);
      }
      
      console.log('❌ AUTENTICAÇÃO DE EMERGÊNCIA: Credenciais inválidas');
      return res.status(401).json({ message: 'Invalid credentials' });
    } catch (error) {
      console.error('❌ AUTENTICAÇÃO DE EMERGÊNCIA: Erro:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Rota para verificar o usuário atual
  app.get('/api-json/user', (req, res) => {
    try {
      console.log('🚨 AUTENTICAÇÃO DE EMERGÊNCIA: Verificando autenticação');
      
      // Verificar se há um usuário na sessão
      if (req.session && req.session.user && req.session.authenticated) {
        console.log('✅ AUTENTICAÇÃO DE EMERGÊNCIA: Usuário autenticado', req.session.user.username);
        return res.status(200).json(req.session.user);
      }
      
      console.log('❌ AUTENTICAÇÃO DE EMERGÊNCIA: Usuário não autenticado');
      return res.status(401).json({ message: 'Not authenticated' });
    } catch (error) {
      console.error('❌ AUTENTICAÇÃO DE EMERGÊNCIA: Erro:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Rota para logout
  app.post('/api-json/logout', (req, res) => {
    try {
      console.log('🚨 AUTENTICAÇÃO DE EMERGÊNCIA: Logout');
      
      if (req.session) {
        // Destruir a sessão
        req.session.destroy((err) => {
          if (err) {
            console.error('❌ AUTENTICAÇÃO DE EMERGÊNCIA: Erro ao destruir sessão:', err);
            return res.status(500).json({ message: 'Error during logout' });
          }
          
          console.log('✅ AUTENTICAÇÃO DE EMERGÊNCIA: Logout bem-sucedido');
          res.status(200).json({ message: 'Logged out successfully' });
        });
      } else {
        console.log('✅ AUTENTICAÇÃO DE EMERGÊNCIA: Nenhuma sessão para destruir');
        res.status(200).json({ message: 'No session to destroy' });
      }
    } catch (error) {
      console.error('❌ AUTENTICAÇÃO DE EMERGÊNCIA: Erro:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
}