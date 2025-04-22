/**
 * AUTENTICAÇÃO SIMPLES PARA EMERGÊNCIAS
 * 
 * Este módulo implementa rotas de autenticação de emergência simples
 * que substituem completamente o sistema de autenticação existente
 * para permitir acesso ao sistema em situações críticas.
 * 
 * ATENÇÃO: Esta é uma configuração de emergência que permite login com qualquer usuário
 * sem verificação de senha. Use apenas para recuperação de acesso.
 */

import express from 'express';
import { Express } from "express";
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export function setupSimpleAuth(app: Express) {
  // ======= LOGIN DIRETO EM MODO EMERGÊNCIA =======
  app.get('/admin-login-direto', async (req, res) => {
    console.log('🚨🚨🚨 ACESSO EMERGENCIAL: Login direto para admin foi solicitado');
    
    try {
      // Buscar o usuário admin diretamente
      const [adminUser] = await db.select().from(users).where(eq(users.username, 'admin'));
      
      if (!adminUser) {
        console.error('❌ ACESSO EMERGENCIAL: Usuário admin não encontrado no banco de dados!');
        return res.status(500).send(`
          <h1>Erro: Usuário admin não encontrado</h1>
          <p>O usuário 'admin' não foi encontrado no banco de dados.</p>
          <a href="/">Voltar para o início</a>
        `);
      }
      
      // Configurar a sessão manualmente e redirecionar
      if (!req.session) {
        req.session = {} as any;
      }
      
      req.session.user = adminUser;
      req.session.authenticated = true;
      
      console.log('✅ ACESSO EMERGENCIAL: Login direto para admin foi bem-sucedido!');
      
      // Redirecionar para a página inicial
      return res.redirect('/admin');
    } catch (error) {
      console.error('❌ ACESSO EMERGENCIAL: Erro ao fazer login direto:', error);
      return res.status(500).send(`
        <h1>Erro ao fazer login direto</h1>
        <p>Ocorreu um erro ao tentar fazer login direto: ${error}</p>
        <a href="/">Voltar para o início</a>
      `);
    }
  });

  // Rota para autenticação de emergência
  app.post('/api-json/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      console.log('🔥 MODO DE EMERGÊNCIA: Requisição de login para:', username);
      
      // Buscar o usuário no banco de dados para obter informações completas
      const [userFromDb] = await db.select().from(users).where(eq(users.username, username));
      
      // ⚠️ MODO INSEGURO: Aceitar qualquer usuário que exista no banco de dados
      // ⚠️ Implementação temporária para recuperação de acesso ao sistema
      if (username) {
        console.log('🔥 MODO DE EMERGÊNCIA: Tentando autenticar usuário:', username);
        
        let user;
        
        // Se o usuário existe no banco de dados, use seus dados reais
        if (userFromDb) {
          console.log('🔥 MODO DE EMERGÊNCIA: Usuário encontrado no banco de dados');
          console.log('🔥 MODO DE EMERGÊNCIA: IGNORANDO VERIFICAÇÃO DE SENHA');
          user = userFromDb;
        } else {
          console.log('❌ MODO DE EMERGÊNCIA: Usuário não encontrado no banco de dados');
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