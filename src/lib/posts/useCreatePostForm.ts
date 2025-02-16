import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export const formSchema = z.object({
  message: z.string().min(1, { message: 'Please enter a message.' }).max(1000, {
    message: 'Max 1000 characters.',
  }),
});

export type Post = z.infer<typeof formSchema>;

export const useCreatePostForm = (defaultValues?: Post) => {
  if (defaultValues) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useForm<Post>({
      resolver: zodResolver(formSchema),
      defaultValues: defaultValues,
    });
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useForm<Post>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        message: '',
      },
    });
  }
};
