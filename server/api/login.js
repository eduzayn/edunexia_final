import express from 'express';
import cors from 'cors';
import { generateToken } from '../auth/token.js';
import '../module-alias.js';

// Login endpoint specially crafted for Vercel
export default async function handler(req, res) {
  // Set content type to JSON
  res.setHeader('Content-Type', 'application/json');
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false, 
      message: 'Method not allowed'
    });
  }
  
  try {
    const { username, password, portalType } = req.body;
    
    // Simple admin login (for emergency access)
    if ((username === 'admin' && password === 'Admin123') || 
        (username === 'superadmin' && password === 'Super123') ||
        (username === 'admin' && password === 'admin123') ||
        (username === 'admin@edunexa.com' && password === 'Admin123')) {
        
      // Create mock user
      const user = {
        id: 18,
        username: username,
        fullName: username === 'admin' ? 'Administrador' : 'Super Administrador',
        email: username.includes('@') ? username : `${username}@edunexa.com`,
        portalType: portalType || 'admin',
        role: 'admin'
      };
      
      // Generate JWT token
      const token = generateToken(user);
      
      return res.status(200).json({
        success: true,
        token,
        ...user
      });
    }
    
    // If not admin credentials, return error
    return res.status(401).json({
      success: false,
      message: "Credenciais inválidas. Verifique seu nome de usuário e senha."
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: "Erro durante o processamento do login",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}