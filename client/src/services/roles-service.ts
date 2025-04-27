import { API_URL } from '@/constants/config';
import { fetchWithAuth } from '@/lib/fetch-with-auth';

// Interfaces
export interface Role {
  id: number;
  name: string;
  description: string;
  scope: string;
  permissions: string[];
  createdAt: string;
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
}

export interface RoleFormData {
  name: string;
  description: string;
  scope: string;
  permissions: number[];
}

/**
 * Fetch all roles from the API
 */
export async function getRoles(): Promise<Role[]> {
  const response = await fetchWithAuth(`${API_URL}/api/roles`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch roles');
  }
  
  return response.json();
}

/**
 * Get a single role by ID
 */
export async function getRoleById(id: string | number): Promise<Role> {
  const response = await fetchWithAuth(`${API_URL}/api/roles/${id}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to fetch role with ID ${id}`);
  }
  
  return response.json();
}

/**
 * Create a new role
 */
export async function createRole(roleData: RoleFormData): Promise<Role> {
  const response = await fetchWithAuth(`${API_URL}/api/roles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(roleData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create role');
  }
  
  return response.json();
}

/**
 * Update an existing role
 */
export async function updateRole(id: number, roleData: RoleFormData): Promise<Role> {
  const response = await fetchWithAuth(`${API_URL}/api/roles/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(roleData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to update role with ID ${id}`);
  }
  
  return response.json();
}

/**
 * Delete a role by ID
 */
export async function deleteRole(id: number): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/api/roles/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to delete role with ID ${id}`);
  }
}

/**
 * Get all permissions from the API
 */
export async function getPermissions(): Promise<Permission[]> {
  const response = await fetchWithAuth(`${API_URL}/api/permissions`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch permissions');
  }
  
  return response.json();
}

/**
 * Assign a role to a user
 */
export async function assignRoleToUser(userId: number, roleId: number, params?: { institutionId?: number, poloId?: number }): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/api/users/${userId}/roles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      roleId,
      ...params
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to assign role to user');
  }
}

/**
 * Remove a role from a user
 */
export async function removeRoleFromUser(userId: number, roleId: number, params?: { institutionId?: number, poloId?: number }): Promise<void> {
  const queryParams = new URLSearchParams();
  if (params?.institutionId) queryParams.append('institutionId', params.institutionId.toString());
  if (params?.poloId) queryParams.append('poloId', params.poloId.toString());
  
  const url = `${API_URL}/api/users/${userId}/roles/${roleId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const response = await fetchWithAuth(url, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove role from user');
  }
} 