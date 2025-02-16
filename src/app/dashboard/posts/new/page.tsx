'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

import createPost from '@/lib/posts/server/createPost';
import { useCreatePostForm } from '@/lib/posts/useCreatePostForm';

export default function NewPost() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useCreatePostForm();

  const { mutate, isPending } = useMutation({
    mutationFn: createPost,
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Successfully Created Post');
      router.push('/dashboard');
      router.refresh();
    },
  });

  const onSubmit = (formData: any) => {
    mutate(formData);
  };

  return (
    <main className="flex flex-col items-center p-16">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">New Post</CardTitle>
          <CardDescription>Enter your message for the post</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
              {isPending ? (
                <Button type="submit" className="w-full" disabled>
                  Creating Post...
                </Button>
              ) : (
                <Button type="submit" className="w-full">
                  Create Post
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
