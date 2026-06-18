'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

import updatePost from '@/lib/posts/server/updatePost';
import { useCreatePostForm } from '@/lib/posts/useCreatePostForm';

export default function EditPostForm({
  postId,
  defaultMessage,
}: {
  postId: number;
  defaultMessage: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useCreatePostForm({ message: defaultMessage });

  const { mutate, isPending } = useMutation({
    mutationFn: (formData: any) => updatePost(postId, formData),
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post updated');
      router.push('/dashboard');
      router.refresh();
    },
  });

  return (
    <main className="flex flex-col items-center p-16">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Edit Post</CardTitle>
          <CardDescription>Update your message</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutate(d))} className="space-y-5">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea placeholder="I will miss class..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
