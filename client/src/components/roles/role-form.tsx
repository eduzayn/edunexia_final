import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { createRole, updateRole, getPermissions } from '@/services/roles-service';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
}

interface RoleFormProps {
  role?: {
    id: number;
    name: string;
    description: string;
    scope: string;
    permissions: number[];
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const formSchema = z.object({
  name: z.string()
    .min(3, { message: 'Role name must be at least 3 characters' })
    .max(50, { message: 'Role name must be less than 50 characters' }),
  description: z.string()
    .min(5, { message: 'Description must be at least 5 characters' })
    .max(200, { message: 'Description must be less than 200 characters' }),
  scope: z.enum(['global', 'institution', 'polo']),
  permissions: z.array(z.number()).min(1, 'Select at least one permission'),
});

type FormValues = z.infer<typeof formSchema>;

export default function RoleForm({ role, onSuccess, onCancel }: RoleFormProps) {
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionCategories, setPermissionCategories] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: role?.name || '',
      description: role?.description || '',
      scope: (role?.scope as any) || 'global',
      permissions: role?.permissions || [],
    },
  });

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const data = await getPermissions();
        setPermissions(data);
        
        // Extract unique categories
        const categories = [...new Set(data.map(p => p.category))];
        setPermissionCategories(categories);
      } catch (err) {
        console.error('Error fetching permissions:', err);
        toast({
          title: 'Error',
          description: 'Failed to load permissions. Please try again.',
          variant: 'destructive',
        });
      }
    };

    fetchPermissions();
  }, []);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      if (role) {
        await updateRole(role.id, values);
        toast({
          title: 'Success',
          description: 'Role updated successfully',
        });
      } else {
        await createRole(values);
        toast({
          title: 'Success',
          description: 'Role created successfully',
        });
      }
      onSuccess();
    } catch (err) {
      console.error('Error saving role:', err);
      toast({
        title: 'Error',
        description: 'Failed to save role. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isPermissionSelected = (permissionId: number) => {
    return form.watch('permissions').includes(permissionId);
  };

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    const currentPermissions = form.getValues('permissions');
    if (checked) {
      form.setValue('permissions', [...currentPermissions, permissionId]);
    } else {
      form.setValue('permissions', currentPermissions.filter(id => id !== permissionId));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter role name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scope"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scope</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="institution">Institution</SelectItem>
                    <SelectItem value="polo">Polo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter role description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormField
            control={form.control}
            name="permissions"
            render={() => (
              <FormItem>
                <FormLabel>Permissions</FormLabel>
                <FormMessage />
                <div className="mt-2 space-y-4">
                  {permissionCategories.map(category => (
                    <Card key={category}>
                      <div className="bg-muted px-4 py-2 font-medium">
                        {category}
                      </div>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                        {permissions
                          .filter(p => p.category === category)
                          .map(permission => (
                            <div key={permission.id} className="flex items-start space-x-2">
                              <Checkbox
                                id={`permission-${permission.id}`}
                                checked={isPermissionSelected(permission.id)}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(permission.id, checked as boolean)
                                }
                              />
                              <div className="grid gap-1.5 leading-none">
                                <label
                                  htmlFor={`permission-${permission.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {permission.name}
                                </label>
                                {permission.description && (
                                  <p className="text-xs text-muted-foreground">
                                    {permission.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 