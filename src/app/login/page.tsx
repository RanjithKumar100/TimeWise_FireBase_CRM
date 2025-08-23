'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });


  const onSubmit = async (data: LoginFormValues) => {
    // Prevent multiple submissions
    if (isLoading) return;
    
    setIsLoading(true);
    
    console.log('🔐 Starting login process for:', data.username);
    
    try {
      const success = await login(data.username, data.password);
      
      console.log('🔐 Login result:', success ? 'SUCCESS' : 'FAILED');
      
      if (success) {
        toast({ title: 'Login Successful', description: 'Redirecting to your dashboard...' });
        router.push('/dashboard');
      } else {
        console.error('❌ Login failed - Invalid credentials or server error');
        toast({ 
          variant: 'destructive', 
          title: 'Login Failed', 
          description: 'Invalid username or password. Check browser console for debug info.' 
        });
      }
    } catch (error: any) {
      console.error('💥 Login Exception:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast({ 
        variant: 'destructive', 
        title: 'Connection Error', 
        description: `Cannot connect to server: ${error.message}` 
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image 
              src="/toprocklogo.png" 
              alt="Top Rock Global" 
              width={120} 
              height={60} 
              className="object-contain"
            />
          </div>
          <CardTitle className="text-3xl">TimeWise</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(onSubmit)} 
              className="space-y-6" 
              method="POST"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  e.preventDefault();
                  form.handleSubmit(onSubmit)();
                }
              }}
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Alex Johnson" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
