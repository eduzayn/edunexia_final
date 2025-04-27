import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getRoles, deleteRole } from '@/services/roles-service';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface Role {
  id: number;
  name: string;
  description: string;
  scope: string;
  permissions: string[];
  createdAt: string;
}

export default function RoleList() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await getRoles();
      setRoles(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('Failed to load roles. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/people/roles/${id}/edit`);
  };

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;
    
    try {
      await deleteRole(roleToDelete.id);
      setRoles(roles.filter(role => role.id !== roleToDelete.id));
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    } catch (err) {
      console.error('Error deleting role:', err);
      setError('Failed to delete role. Please try again later.');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-6">Loading roles...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">{error}</p>
        <Button variant="outline" onClick={fetchRoles} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div>
      {roles.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No roles found.</p>
          <Button 
            onClick={() => router.push('/admin/people/roles/new')}
            className="mt-4"
          >
            Create your first role
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="relative">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    <Badge variant={role.scope === 'global' ? 'default' : 'outline'}>
                      {role.scope}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((permission, index) => (
                        <Badge key={index} variant="secondary" className="mr-1 mb-1">
                          {permission}
                        </Badge>
                      ))}
                      {role.permissions.length > 3 && (
                        <Badge variant="secondary">+{role.permissions.length - 3} more</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(role.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(role.id)}
                      className="h-8 w-8 p-0"
                    >
                      <span className="sr-only">Edit</span>
                      <PencilSquareIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(role)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <span className="sr-only">Delete</span>
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role "{roleToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 