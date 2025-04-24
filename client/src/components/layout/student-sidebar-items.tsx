import React from 'react';
import { 
  BookOpenText, 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  GraduationCap,
  User, 
  FileQuestion, 
  BriefcaseBusiness,
  Handshake,
  Banknote,
  MessagesSquare,
  BookMarked
} from 'lucide-react';

import { SidebarItem, SidebarCategory, SidebarItemOrCategory, isCategory } from "./admin-sidebar-items";

/**
 * Retorna os itens padronizados para a barra lateral do portal do aluno
 * @param pathname Caminho atual da rota
 * @returns Array de itens do menu
 */
export const getStudentSidebarItems = (pathname: string): SidebarItemOrCategory[] => {
  return [
    {
      name: 'Início',
      icon: <LayoutDashboard size={18} />,
      href: '/student',
      active: pathname === '/student',
    },
    {
      name: 'Meus cursos',
      icon: <BookOpenText size={18} />,
      href: '/student/courses',
      active: pathname === '/student/courses' || pathname.startsWith('/student/courses/'),
    },
    {
      name: 'Biblioteca',
      icon: <BookMarked size={18} />,
      href: '/student/library',
      active: pathname === '/student/library',
    },
    {
      name: 'Credencial',
      icon: <GraduationCap size={18} />,
      href: '/student/credencial',
      active: pathname === '/student/credencial',
    },
    {
      name: 'Avaliações',
      icon: <FileQuestion size={18} />,
      href: '/student/assessments',
      active: pathname === '/student/assessments',
    },
    {
      name: 'Estágios',
      icon: <BriefcaseBusiness size={18} />,
      href: '/student/internships',
      active: pathname === '/student/internships',
    },
    {
      name: 'Contratos',
      icon: <Handshake size={18} />,
      href: '/student/contracts',
      active: pathname === '/student/contracts',
    },
    {
      name: 'Financeiro',
      icon: <Banknote size={18} />,
      href: '/student/financial',
      active: pathname === '/student/financial',
    },
    {
      name: 'Calendário',
      icon: <Calendar size={18} />,
      href: '/student/calendar',
      active: pathname === '/student/calendar',
    },
    {
      name: 'Mensagens',
      icon: <MessagesSquare size={18} />,
      href: '/student/messages',
      active: pathname === '/student/messages',
    },
    {
      name: 'Meu Perfil',
      icon: <User size={18} />,
      href: '/student/profile',
      active: pathname === '/student/profile',
    },
  ];
};