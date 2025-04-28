import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from '@/hooks/useSession';
import { hasAccess } from '@/lib/auth/hasAccess';
import AdminLayout from '@/components/layout/AdminLayout';
import RoleForm from '@/components/roles/role-form';
import { getRoleById } from '@/services/roles-service';

export default function EditRolePage() {
  const router = useRouter();
  const { id } = router.query;
  const { session, loading } = useSession();
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id && typeof id === 'string') {
      setIsLoading(true);
      getRoleById(id)
        .then((data) => {
          setRole(data);
        })
        .catch((error) => {
          console.error('Error fetching role:', error);
          // Handle error - show notification or redirect
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id]);

  if (loading || isLoading) {
    return <div>Loading...</div>;
  }

  // Check if user has access to this page
  if (!hasAccess(session, ['admin'])) {
    router.push('/auth');
    return null;
  }

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900">Edit Role</h1>
          <p className="mt-2 text-sm text-gray-700">
            Update role information and permissions
          </p>
        </div>
        
        {role && (
          <RoleForm 
            role={role}
            isEdit={true}
            onSuccess={() => router.push('/admin/people/roles')}
            onCancel={() => router.push('/admin/people/roles')} 
          />
        )}
      </div>
    </AdminLayout>
  );
} 