import React from 'react';
import { useRouter } from 'next/router';
import { useSession } from '@/hooks/useSession';
import { hasAccess } from '@/lib/auth/hasAccess';
import AdminLayout from '@/components/layout/AdminLayout';
import RoleForm from '@/components/roles/role-form';

export default function NewRolePage() {
  const router = useRouter();
  const { session, loading } = useSession();

  if (loading) {
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
          <h1 className="text-xl font-semibold text-gray-900">Create New Role</h1>
          <p className="mt-2 text-sm text-gray-700">
            Define a new role and its permissions
          </p>
        </div>
        
        <RoleForm 
          onSuccess={() => router.push('/admin/people/roles')}
          onCancel={() => router.push('/admin/people/roles')} 
        />
      </div>
    </AdminLayout>
  );
} 