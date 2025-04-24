// Usando tipagem diretamente ao invés de importar o tipo que parece estar com incompatibilidade
// O tipo User na aplicação contém estes campos adicionais no runtime

export interface ExtendedUser {
  id: number;
  username: string;
  password: string;
  fullName: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  birthDate: string | null;
  portalType: string;
  poloId: number | null;
  asaasId: string | null;
  
  // Campos adicionais que existem no runtime mas não no schema
  role: string;
}