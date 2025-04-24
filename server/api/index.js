import express from 'express';
import cors from 'cors';
import { registerRoutes } from '../routes.js';
import '../module-alias.js';

// Simple serverless function wrapper for Vercel
export default async function handler(req, res) {
  // Create an express app
  const app = express();
  
  // Configure middleware
  app.use(express.json());
  app.use(cors());
  
  // Register API routes
  await registerRoutes(app);
  
  // Handle the request
  // Trick to make Express work with serverless functions
  app._router.handle(req, res);
}