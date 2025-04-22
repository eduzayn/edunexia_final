import React from "react";
import { CircleIcon } from "@/components/ui/circle-icon";
import {
  DashboardIcon,
  BusinessIcon,
  GroupIcon,
  MenuBookIcon,
  HandshakeIcon,
  StorefrontIcon,
  MonetizationOnIcon,
  BarChartAltIcon,
  CloudIcon,
  BuildIcon,
  SecurityIcon,
  SettingsIcon,
  AssignmentIcon,
  LayersIcon,
  UsersIcon,
  FolderIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  GraduationCapAltIcon,
  BookIcon,
  BuildingIcon,
  AwardIcon,
  FileCheckIcon,
  ScrollTextIcon,
  Settings2Icon,
  BadgeCheckIcon,
  CRMIcon,
  UserPlusIcon,
  ContactIcon,
  BuildingStoreIcon,
  ContractIcon,
  InvoiceIcon,
  ShoppingBagIcon,
  PaymentsIcon,
  InboxIcon,
  MessageSquareIcon,
  WhatsAppIcon,
  MailIcon,
  InstagramIcon,
  FacebookIcon,
  TelegramIcon,
  WidgetIcon,
} from "@/components/ui/icons";
import { CircleDollarSign, ShieldIcon } from "lucide-react";

// Interfaces para definir a estrutura dos itens da barra lateral
export interface SidebarItem {
  name: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
}

export interface SidebarCategory {
  name: string;
  icon: React.ReactNode;
  items: SidebarItem[];
  expanded?: boolean;
}

export type SidebarItemOrCategory = SidebarItem | SidebarCategory;

// Função para verificar se um item é uma categoria
export function isCategory(item: SidebarItemOrCategory): item is SidebarCategory {
  return 'items' in item;
}

// Função para verificar se algum item dentro de uma categoria está ativo
function hasCategoryActiveItem(category: SidebarCategory, currentPath: string): boolean {
  return category.items.some(item => 
    item.active || 
    currentPath === item.href || 
    (Boolean(currentPath) && currentPath.includes(item.href) && item.href !== '/admin/dashboard')
  );
}

/**
 * Retorna uma lista estruturada de itens para a barra lateral do portal administrativo
 * com categorias e subcategorias para melhor organização
 */
export function getAdminSidebarItems(currentPath: string): SidebarItemOrCategory[] {
  // Item principal sempre visível no topo
  const mainItems: SidebarItemOrCategory[] = [
    { 
      name: "Dashboard", 
      icon: <DashboardIcon />, 
      href: "/admin/dashboard",
      active: currentPath === "/admin/dashboard"
    },
  ];

  // Categoria: Acadêmico
  const academicCategory: SidebarCategory = {
    name: "Acadêmico",
    icon: <MenuBookIcon />,
    expanded: hasCategoryActiveItem({
      name: "Acadêmico",
      icon: <MenuBookIcon />,
      items: [
        { 
          name: "Disciplinas", 
          icon: <BookIcon />, 
          href: "/admin/academico/disciplines",
          active: currentPath === "/admin/academico/disciplines" || (currentPath && currentPath.includes("/admin/academico/disciplines/"))
        },
        { 
          name: "Cursos", 
          icon: <GraduationCapAltIcon />, 
          href: "/admin/academico/courses",
          active: currentPath === "/admin/academico/courses" || (currentPath && currentPath.includes("/admin/academico/courses/"))
        },
      ]
    }, currentPath),
    items: [
        { 
          name: "Disciplinas", 
          icon: <BookIcon />, 
          href: "/admin/academico/disciplines",
          active: currentPath === "/admin/academico/disciplines" || (currentPath && currentPath.includes("/admin/academico/disciplines/"))
        },
        { 
          name: "Cursos", 
          icon: <GraduationCapAltIcon />, 
          href: "/admin/academico/courses",
          active: currentPath === "/admin/academico/courses" || (currentPath && currentPath.includes("/admin/academico/courses/"))
        },
    ]
  };

  // Categoria: Institucional
  const institutionalCategory: SidebarCategory = {
    name: "Institucional",
    icon: <BuildingIcon />,
    expanded: hasCategoryActiveItem({
      name: "Institucional",
      icon: <BuildingIcon />,
      items: [
        { 
          name: "Instituições", 
          icon: <BusinessIcon />, 
          href: "/admin/institutions",
          active: currentPath === "/admin/institutions"
        },
        { 
          name: "Polos", 
          icon: <StorefrontIcon />, 
          href: "/admin/polos",
          active: currentPath === "/admin/polos"
        },
        { 
          name: "Parceiros", 
          icon: <HandshakeIcon />, 
          href: "/admin/partners",
          active: currentPath === "/admin/partners"
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Instituições", 
        icon: <BusinessIcon />, 
        href: "/admin/institutions",
        active: currentPath === "/admin/institutions"
      },
      { 
        name: "Polos", 
        icon: <StorefrontIcon />, 
        href: "/admin/polos",
        active: currentPath === "/admin/polos"
      },
      { 
        name: "Parceiros", 
        icon: <HandshakeIcon />, 
        href: "/admin/partners",
        active: currentPath === "/admin/partners"
      },
    ]
  };

  // Categoria: Pessoas (reorganizada sem funcionalidades administrativas)
  const peopleCategory: SidebarCategory = {
    name: "Pessoas",
    icon: <UsersIcon />,
    expanded: hasCategoryActiveItem({
      name: "Pessoas",
      icon: <UsersIcon />,
      items: [
        { 
          name: "Usuários", 
          icon: <GroupIcon />, 
          href: "/admin/pessoas/usuarios",
          active: currentPath === "/admin/pessoas/usuarios" || (currentPath && currentPath.includes("/admin/pessoas/usuarios/"))
        },
        { 
          name: "Alunos", 
          icon: <UserPlusIcon />, 
          href: "/admin/pessoas/alunos",
          active: currentPath === "/admin/pessoas/alunos" || (currentPath && currentPath.includes("/admin/pessoas/alunos"))
        },
        { 
          name: "Professores", 
          icon: <BadgeCheckIcon />, 
          href: "/admin/pessoas/professores",
          active: currentPath === "/admin/pessoas/professores" || (currentPath && currentPath.includes("/admin/pessoas/professores"))
        },
        { 
          name: "Colaboradores", 
          icon: <GroupIcon />, 
          href: "/admin/pessoas/colaboradores",
          active: currentPath === "/admin/pessoas/colaboradores" || (currentPath && currentPath.includes("/admin/pessoas/colaboradores"))
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Usuários", 
        icon: <GroupIcon />, 
        href: "/admin/pessoas/usuarios",
        active: currentPath === "/admin/pessoas/usuarios" || (currentPath && currentPath.includes("/admin/pessoas/usuarios/"))
      },
      { 
        name: "Alunos", 
        icon: <UserPlusIcon />, 
        href: "/admin/pessoas/alunos",
        active: currentPath === "/admin/pessoas/alunos" || (currentPath && currentPath.includes("/admin/pessoas/alunos"))
      },
      { 
        name: "Professores", 
        icon: <BadgeCheckIcon />, 
        href: "/admin/pessoas/professores",
        active: currentPath === "/admin/pessoas/professores" || (currentPath && currentPath.includes("/admin/pessoas/professores"))
      },
      { 
        name: "Colaboradores", 
        icon: <GroupIcon />, 
        href: "/admin/pessoas/colaboradores",
        active: currentPath === "/admin/pessoas/colaboradores" || (currentPath && currentPath.includes("/admin/pessoas/colaboradores"))
      },
    ]
  };

  // Categoria: Operacional
  const operationalCategory: SidebarCategory = {
    name: "Operacional",
    icon: <FolderIcon />,
    expanded: hasCategoryActiveItem({
      name: "Operacional",
      icon: <FolderIcon />,
      items: [
        { 
          name: "Relatórios", 
          icon: <BarChartAltIcon />, 
          href: "/admin/reports",
          active: currentPath === "/admin/reports"
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Relatórios", 
        icon: <BarChartAltIcon />, 
        href: "/admin/reports",
        active: currentPath === "/admin/reports"
      },
    ]
  };

  // Categoria: Certificação
  const certificationCategory: SidebarCategory = {
    name: "Certificação",
    icon: <AwardIcon />,
    expanded: hasCategoryActiveItem({
      name: "Certificação",
      icon: <AwardIcon />,
      items: [
        { 
          name: "Templates", 
          icon: <ScrollTextIcon />, 
          href: "/admin/certification/templates",
          active: currentPath === "/admin/certification/templates" || (currentPath && currentPath.includes("/admin/certification/templates/"))
        },
        { 
          name: "Signatários", 
          icon: <FileCheckIcon />, 
          href: "/admin/certification/signers",
          active: currentPath === "/admin/certification/signers" || (currentPath && currentPath.includes("/admin/certification/signers/"))
        },
        { 
          name: "Emissão de Certificados", 
          icon: <BadgeCheckIcon />, 
          href: "/admin/certification/issue",
          active: currentPath === "/admin/certification/issue" || (currentPath && currentPath.includes("/admin/certification/issue/"))
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Templates", 
        icon: <ScrollTextIcon />, 
        href: "/admin/certification/templates",
        active: currentPath === "/admin/certification/templates" || (currentPath && currentPath.includes("/admin/certification/templates/"))
      },
      { 
        name: "Signatários", 
        icon: <FileCheckIcon />, 
        href: "/admin/certification/signers",
        active: currentPath === "/admin/certification/signers" || (currentPath && currentPath.includes("/admin/certification/signers/"))
      },
      { 
        name: "Emissão de Certificados", 
        icon: <BadgeCheckIcon />, 
        href: "/admin/certification/issue",
        active: currentPath === "/admin/certification/issue" || (currentPath && currentPath.includes("/admin/certification/issue/"))
      },
    ]
  };

  // Categoria: CRM & Gestão
  const crmCategory: SidebarCategory = {
    name: "CRM & Gestão",
    icon: <CRMIcon />,
    expanded: hasCategoryActiveItem({
      name: "CRM & Gestão",
      icon: <CRMIcon />,
      items: [
        // Submódulo CRM
        { 
          name: "Clientes", 
          icon: <BuildingStoreIcon />, 
          href: "/admin/crm/clients",
          active: currentPath === "/admin/crm/clients" || (currentPath && currentPath.includes("/admin/crm/clients/"))
        },
        { 
          name: "Contatos", 
          icon: <ContactIcon />, 
          href: "/admin/crm/contacts",
          active: currentPath === "/admin/crm/contacts" || (currentPath && currentPath.includes("/admin/crm/contacts/"))
        },
        // Submódulo Financeiro
        { 
          name: "Cursos e Serviços", 
          icon: <ShoppingBagIcon />, 
          href: "/admin/finance/products",
          active: currentPath === "/admin/finance/products" || (currentPath && currentPath.includes("/admin/finance/products/"))
        },
        { 
          name: "Cobranças", 
          icon: <InvoiceIcon />, 
          href: "/admin/finance/charges",
          active: currentPath === "/admin/finance/charges" || (currentPath && currentPath.includes("/admin/finance/charges/"))
        },
        { 
          name: "Pagamentos", 
          icon: <PaymentsIcon />, 
          href: "/admin/finance/payments",
          active: currentPath === "/admin/finance/payments" || (currentPath && currentPath.includes("/admin/finance/payments/"))
        },
        // Submódulo Contratos
        { 
          name: "Contratos", 
          icon: <ContractIcon />, 
          href: "/admin/contracts",
          active: currentPath === "/admin/contracts" || (currentPath && currentPath.includes("/admin/contracts/"))
        },
      ]
    }, currentPath),
    items: [
      // Submódulo CRM
      { 
        name: "Clientes", 
        icon: <BuildingStoreIcon />, 
        href: "/admin/crm/clients",
        active: currentPath === "/admin/crm/clients" || (currentPath && currentPath.includes("/admin/crm/clients/"))
      },
      { 
        name: "Contatos", 
        icon: <ContactIcon />, 
        href: "/admin/crm/contacts",
        active: currentPath === "/admin/crm/contacts" || (currentPath && currentPath.includes("/admin/crm/contacts/"))
      },
      // Submódulo Financeiro
      { 
        name: "Cursos e Serviços", 
        icon: <ShoppingBagIcon />, 
        href: "/admin/finance/products",
        active: currentPath === "/admin/finance/products" || (currentPath && currentPath.includes("/admin/finance/products/"))
      },
      { 
        name: "Cobranças", 
        icon: <InvoiceIcon />, 
        href: "/admin/finance/charges",
        active: currentPath === "/admin/finance/charges" || (currentPath && currentPath.includes("/admin/finance/charges/"))
      },
      /* Item Pagamentos removido - Obsoleto após integração com Asaas */
      // Submódulo Contratos
      { 
        name: "Contratos", 
        icon: <ContractIcon />, 
        href: "/admin/contracts",
        active: currentPath === "/admin/contracts" || (currentPath && currentPath.includes("/admin/contracts/"))
      },
    ]
  };
  
  // Categoria: Comunicação
  const communicationCategory: SidebarCategory = {
    name: "Comunicação",
    icon: <MessageSquareIcon />,
    expanded: hasCategoryActiveItem({
      name: "Comunicação",
      icon: <MessageSquareIcon />,
      items: [
        { 
          name: "Canais", 
          icon: <InboxIcon />, 
          href: "/admin/comunicacao/inbox",
          active: currentPath === "/admin/comunicacao/inbox" || (currentPath && currentPath.includes("/admin/comunicacao/inbox/"))
        },
        { 
          name: "WhatsApp", 
          icon: <WhatsAppIcon />, 
          href: "/admin/comunicacao/whatsapp",
          active: currentPath === "/admin/comunicacao/whatsapp" || (currentPath && currentPath.includes("/admin/comunicacao/whatsapp/"))
        },
        { 
          name: "Email", 
          icon: <MailIcon />, 
          href: "/admin/comunicacao/email",
          active: currentPath === "/admin/comunicacao/email" || (currentPath && currentPath.includes("/admin/comunicacao/email/"))
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Canais", 
        icon: <InboxIcon />, 
        href: "/admin/comunicacao/inbox",
        active: currentPath === "/admin/comunicacao/inbox" || (currentPath && currentPath.includes("/admin/comunicacao/inbox/"))
      },
      { 
        name: "WhatsApp", 
        icon: <WhatsAppIcon />, 
        href: "/admin/comunicacao/whatsapp",
        active: currentPath === "/admin/comunicacao/whatsapp" || (currentPath && currentPath.includes("/admin/comunicacao/whatsapp/"))
      },
      { 
        name: "Email", 
        icon: <MailIcon />, 
        href: "/admin/comunicacao/email",
        active: currentPath === "/admin/comunicacao/email" || (currentPath && currentPath.includes("/admin/comunicacao/email/"))
      },
    ]
  };

  // NOVA SEÇÃO: ADMINISTRAÇÃO
  // Categoria: Administração - Sistema
  const adminSystemCategory: SidebarCategory = {
    name: "Sistema",
    icon: <BuildIcon />,
    expanded: hasCategoryActiveItem({
      name: "Sistema",
      icon: <BuildIcon />,
      items: [
        { 
          name: "Integrações", 
          icon: <CloudIcon />, 
          href: "/admin/integracoes/integrations",
          active: currentPath === "/admin/integracoes/integrations" || (currentPath && currentPath.includes("/admin/integracoes/"))
        },
        { 
          name: "Segurança", 
          icon: <SecurityIcon />, 
          href: "/admin/sistema/security",
          active: currentPath === "/admin/sistema/security" || (currentPath && currentPath.includes("/admin/sistema/security"))
        },
        { 
          name: "Auditoria", 
          icon: <FileCheckIcon />, 
          href: "/admin/auditoria/logs",
          active: currentPath === "/admin/auditoria/logs" || (currentPath && currentPath.includes("/admin/auditoria/"))
        },
        { 
          name: "Configurações", 
          icon: <SettingsIcon />, 
          href: "/admin/sistema/settings",
          active: currentPath === "/admin/sistema/settings" || (currentPath && currentPath.includes("/admin/sistema/settings"))
        },
        { 
          name: "Configurações da Instituição", 
          icon: <Settings2Icon />, 
          href: "/admin/sistema/institution-settings",
          active: currentPath === "/admin/sistema/institution-settings" || (currentPath && currentPath.includes("/admin/sistema/institution-settings"))
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Integrações", 
        icon: <CloudIcon />, 
        href: "/admin/integracoes/integrations",
        active: currentPath === "/admin/integracoes/integrations" || (currentPath && currentPath.includes("/admin/integracoes/"))
      },
      { 
        name: "Segurança", 
        icon: <SecurityIcon />, 
        href: "/admin/sistema/security",
        active: currentPath === "/admin/sistema/security" || (currentPath && currentPath.includes("/admin/sistema/security"))
      },
      { 
        name: "Auditoria", 
        icon: <FileCheckIcon />, 
        href: "/admin/auditoria/logs",
        active: currentPath === "/admin/auditoria/logs" || (currentPath && currentPath.includes("/admin/auditoria/"))
      },
      { 
        name: "Configurações", 
        icon: <SettingsIcon />, 
        href: "/admin/sistema/settings",
        active: currentPath === "/admin/sistema/settings" || (currentPath && currentPath.includes("/admin/sistema/settings"))
      },
      { 
        name: "Configurações da Instituição", 
        icon: <Settings2Icon />, 
        href: "/admin/sistema/institution-settings",
        active: currentPath === "/admin/sistema/institution-settings" || (currentPath && currentPath.includes("/admin/sistema/institution-settings"))
      },
    ]
  };

  // Categoria: Administração - Permissões
  const adminPermissionsCategory: SidebarCategory = {
    name: "Permissões",
    icon: <SecurityIcon />,
    expanded: hasCategoryActiveItem({
      name: "Permissões",
      icon: <SecurityIcon />,
      items: [
        { 
          name: "Papéis & Permissões", 
          icon: <SecurityIcon />, 
          href: "/admin/pessoas/roles",
          active: currentPath === "/admin/pessoas/roles" || (currentPath && currentPath.includes("/admin/pessoas/roles"))
        },
        { 
          name: "Permissões Contextuais", 
          icon: <BadgeCheckIcon />, 
          href: "/admin/pessoas/abac-permissions",
          active: currentPath === "/admin/pessoas/abac-permissions" || (currentPath && currentPath.includes("/admin/pessoas/abac"))
        },
        { 
          name: "Usuários Admin", 
          icon: <GroupIcon />, 
          href: "/admin/pessoas/admin-users",
          active: currentPath === "/admin/pessoas/admin-users" || (currentPath && currentPath.includes("/admin/pessoas/admin-users"))
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Papéis & Permissões", 
        icon: <SecurityIcon />, 
        href: "/admin/pessoas/roles",
        active: currentPath === "/admin/pessoas/roles" || (currentPath && currentPath.includes("/admin/pessoas/roles"))
      },
      { 
        name: "Permissões Contextuais", 
        icon: <BadgeCheckIcon />, 
        href: "/admin/pessoas/abac-permissions",
        active: currentPath === "/admin/pessoas/abac-permissions" || (currentPath && currentPath.includes("/admin/pessoas/abac"))
      },
      { 
        name: "Usuários Admin", 
        icon: <GroupIcon />, 
        href: "/admin/pessoas/admin-users",
        active: currentPath === "/admin/pessoas/admin-users" || (currentPath && currentPath.includes("/admin/pessoas/admin-users"))
      },
    ]
  };

  // Categoria: Administração - Institucional (nível corporativo)
  const adminInstitutionalCategory: SidebarCategory = {
    name: "Institucional",
    icon: <BuildingIcon />,
    expanded: hasCategoryActiveItem({
      name: "Institucional",
      icon: <BuildingIcon />,
      items: [
        { 
          name: "Instituições", 
          icon: <BusinessIcon />, 
          href: "/admin/institutions",
          active: currentPath === "/admin/institutions"
        },
        { 
          name: "Polos", 
          icon: <StorefrontIcon />, 
          href: "/admin/polos",
          active: currentPath === "/admin/polos"
        },
        { 
          name: "Parceiros", 
          icon: <HandshakeIcon />, 
          href: "/admin/partners",
          active: currentPath === "/admin/partners"
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Instituições", 
        icon: <BusinessIcon />, 
        href: "/admin/institutions",
        active: currentPath === "/admin/institutions"
      },
      { 
        name: "Polos", 
        icon: <StorefrontIcon />, 
        href: "/admin/polos",
        active: currentPath === "/admin/polos"
      },
      { 
        name: "Parceiros", 
        icon: <HandshakeIcon />, 
        href: "/admin/partners",
        active: currentPath === "/admin/partners"
      },
    ]
  };
  
  // Categoria: Administração - Financeiro Empresarial
  const adminFinanceCategory: SidebarCategory = {
    name: "Financeiro Empresarial",
    icon: <CircleDollarSign />,
    expanded: hasCategoryActiveItem({
      name: "Financeiro Empresarial",
      icon: <CircleDollarSign />,
      items: [
        { 
          name: "Antecipação de Recebíveis", 
          icon: <CircleDollarSign />, 
          href: "/admin/financeiro-empresarial/antecipacao",
          active: currentPath === "/admin/financeiro-empresarial/antecipacao" || (currentPath && currentPath.includes("/admin/financeiro-empresarial/antecipacao"))
        },
        { 
          name: "Configurações Financeiras", 
          icon: <SettingsIcon />, 
          href: "/admin/financeiro-empresarial/configuracoes",
          active: currentPath === "/admin/financeiro-empresarial/configuracoes" || (currentPath && currentPath.includes("/admin/financeiro-empresarial/configuracoes"))
        },
        { 
          name: "Relatórios Consolidados", 
          icon: <BarChartAltIcon />, 
          href: "/admin/financeiro-empresarial/relatorios",
          active: currentPath === "/admin/financeiro-empresarial/relatorios" || (currentPath && currentPath.includes("/admin/financeiro-empresarial/relatorios"))
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Antecipação de Recebíveis", 
        icon: <CircleDollarSign />, 
        href: "/admin/financeiro-empresarial/antecipacao",
        active: currentPath === "/admin/financeiro-empresarial/antecipacao" || (currentPath && currentPath.includes("/admin/financeiro-empresarial/antecipacao"))
      },
      { 
        name: "Configurações Financeiras", 
        icon: <SettingsIcon />, 
        href: "/admin/financeiro-empresarial/configuracoes",
        active: currentPath === "/admin/financeiro-empresarial/configuracoes" || (currentPath && currentPath.includes("/admin/financeiro-empresarial/configuracoes"))
      },
      { 
        name: "Relatórios Consolidados", 
        icon: <BarChartAltIcon />, 
        href: "/admin/financeiro-empresarial/relatorios",
        active: currentPath === "/admin/financeiro-empresarial/relatorios" || (currentPath && currentPath.includes("/admin/financeiro-empresarial/relatorios"))
      },
    ]
  };

  // Categoria principal de Administração (contém todas as sub-categorias administrativas)
  const administrationCategory: SidebarCategory = {
    name: "Administração",
    icon: <ShieldIcon />,
    expanded: hasCategoryActiveItem({
      name: "Administração",
      icon: <ShieldIcon />,
      items: [
        // Representa os itens de todas as subcategorias
        // Precisamos apenas verificar se alguma categoria filha está ativa
        { 
          name: "Sistema", 
          icon: <BuildIcon />, 
          href: "/admin/sistema/settings",
          active: Boolean(currentPath) && (
            currentPath.includes("/admin/sistema/") || 
            currentPath.includes("/admin/integracoes/") ||
            currentPath.includes("/admin/auditoria/")
          )
        },
        { 
          name: "Permissões", 
          icon: <SecurityIcon />, 
          href: "/admin/pessoas/roles",
          active: Boolean(currentPath) && (
            currentPath.includes("/admin/pessoas/roles") || 
            currentPath.includes("/admin/pessoas/abac") || 
            currentPath.includes("/admin/pessoas/admin-users")
          )
        },
        { 
          name: "Institucional", 
          icon: <BuildingIcon />, 
          href: "/admin/institutions",
          active: Boolean(currentPath) && (
            currentPath.includes("/admin/institutions") || 
            currentPath.includes("/admin/polos") || 
            currentPath.includes("/admin/partners")
          )
        },
        { 
          name: "Financeiro Empresarial", 
          icon: <CircleDollarSign />, 
          href: "/admin/financeiro-empresarial",
          active: Boolean(currentPath) && (
            currentPath.includes("/admin/financeiro-empresarial/")
          )
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Sistema", 
        icon: <BuildIcon />, 
        href: "/admin/sistema/settings",
        active: Boolean(currentPath) && currentPath.includes("/admin/sistema/")
      },
      { 
        name: "Permissões", 
        icon: <SecurityIcon />, 
        href: "/admin/pessoas/roles",
        active: Boolean(currentPath) && currentPath.includes("/admin/pessoas/roles")
      },
      { 
        name: "Institucional", 
        icon: <BuildingIcon />, 
        href: "/admin/institutions",
        active: Boolean(currentPath) && currentPath.includes("/admin/institutions")
      },
      { 
        name: "Financeiro Empresarial", 
        icon: <CircleDollarSign />, 
        href: "/admin/financeiro-empresarial",
        active: Boolean(currentPath) && currentPath.includes("/admin/financeiro-empresarial")
      }
    ]
  };

  // Combinar todos os itens e categorias
  return [
    ...mainItems,
    academicCategory,
    peopleCategory,
    crmCategory,
    communicationCategory,
    certificationCategory,
    operationalCategory,
    administrationCategory, // Nova categoria no final do menu
  ];
}