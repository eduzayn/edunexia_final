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
  LockIcon,
} from "@/components/ui/icons";
import { CircleDollarSign, ShieldIcon, CreditCardIcon, GraduationCap } from "lucide-react";

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
          icon: <CreditCardIcon />, 
          href: "/admin/crm/asaas-clients",
          active: currentPath === "/admin/crm/asaas-clients" || (currentPath && currentPath.includes("/admin/crm/asaas-clients/"))
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
          name: "Matrículas Simplificadas",
          icon: <GraduationCap />,
          href: "/admin/crm/new-simplified-enrollments",
          active: currentPath === "/admin/crm/new-simplified-enrollments" || (currentPath && currentPath.includes("/admin/crm/new-simplified-enrollments/"))
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
        icon: <CreditCardIcon />, 
        href: "/admin/crm/asaas-clients",
        active: currentPath === "/admin/crm/asaas-clients" || (currentPath && currentPath.includes("/admin/crm/asaas-clients/"))
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
        name: "Matrículas Simplificadas",
        icon: <GraduationCap />,
        href: "/admin/crm/new-simplified-enrollments",
        active: currentPath === "/admin/crm/new-simplified-enrollments" || (currentPath && currentPath.includes("/admin/crm/new-simplified-enrollments/"))
      },
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

  // Categoria: Sistema (com funcionalidades administrativas)
  const operationalCategory: SidebarCategory = {
    name: "Sistema",
    icon: <BuildIcon />,
    expanded: hasCategoryActiveItem({
      name: "Sistema",
      icon: <BuildIcon />,
      items: [
        { 
          name: "Controle de Acesso ao Portal do Aluno", 
          icon: <LockIcon />, 
          href: "/admin/sistema/portal-access-control",
          active: currentPath === "/admin/sistema/portal-access-control" || (currentPath && currentPath.includes("/admin/sistema/portal-access-control"))
        },
        { 
          name: "Permissões Contextuais (ABAC)", 
          icon: <BadgeCheckIcon />, 
          href: "/admin/pessoas/abac-permissions",
          active: currentPath === "/admin/pessoas/abac-permissions" || (currentPath && currentPath.includes("/admin/pessoas/abac"))
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Controle de Acesso ao Portal do Aluno", 
        icon: <LockIcon />, 
        href: "/admin/sistema/portal-access-control",
        active: currentPath === "/admin/sistema/portal-access-control" || (currentPath && currentPath.includes("/admin/sistema/portal-access-control"))
      },
      { 
        name: "Permissões Contextuais (ABAC)", 
        icon: <BadgeCheckIcon />, 
        href: "/admin/pessoas/abac-permissions",
        active: currentPath === "/admin/pessoas/abac-permissions" || (currentPath && currentPath.includes("/admin/pessoas/abac"))
      },
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
  ];
}