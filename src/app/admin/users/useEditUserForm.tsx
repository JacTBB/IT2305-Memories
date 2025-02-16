import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  role: z.enum(['public', 'classmate', 'admin']),
});

export type User = z.infer<typeof formSchema>;

export const useEditUserForm = (defaultValues?: User) => {
  if (defaultValues) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useForm<User>({
      resolver: zodResolver(formSchema),
      defaultValues: defaultValues,
    });
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useForm<User>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        role: 'public',
      },
    });
  }
};
