'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type ForgotPasswordFormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    console.log('🔐 Starting forgot password process for:', data.email);
    
    try {
      const response = await apiClient.forgotPassword(data.email);
      
      console.log('🔐 Forgot password result:', response.success ? 'SUCCESS' : 'FAILED');
      
      if (response.success) {
        setSubmittedEmail(data.email);
        setEmailSent(true);
        toast({ 
          title: 'Reset Email Sent', 
          description: 'Check your email for password reset instructions.' 
        });
      } else {
        toast({ 
          variant: 'destructive', 
          title: 'Request Failed', 
          description: response.message || 'Failed to send reset email. Please try again.' 
        });
      }
    } catch (error: any) {
      console.error('💥 Forgot Password Exception:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Connection Error', 
        description: `Failed to send reset email: ${error.message}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    form.setValue('email', submittedEmail);
  };

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-600">Email Sent!</CardTitle>
            <CardDescription>
              Check your email for reset instructions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <Mail className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-800">
                  We've sent a password reset link to:
                </p>
                <p className="font-semibold text-green-900 mt-1">
                  {submittedEmail}
                </p>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p>🕐 The link expires in <strong>1 hour</strong></p>
                <p>📧 Check your spam folder if you don't see it</p>
                <p>🔗 Click the link in the email to reset your password</p>
              </div>
              
              <div className="pt-4 space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleResendEmail}
                >
                  Send Another Email
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={handleBackToLogin}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/logos/lof-logo.png"
              alt="LOF"
              width={120}
              height={60}
              className="object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Forgot Password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="your.email@example.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full"
                  onClick={handleBackToLogin}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Remember your password?{' '}
                  <Link 
                    href="/login" 
                    className="text-primary hover:underline"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}