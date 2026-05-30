'use client';

/**
 * Login Page - Professional authentication UI
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

// Dynamic import for Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Import ship animation
import shipAnimation from '@/assets/ship-animation.json';

// Form validation schema
const loginSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Clear error when component unmounts or when user starts typing
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const onSubmit = async (data: LoginFormData) => {
    const success = await login(data.userId, data.password);
    if (success) {
      toast.success('Login successful', {
        description: 'Welcome back! Redirecting to dashboard...',
      });
      router.push('/dashboard');
    } else {
      // Get the latest error from the store after login attempt
      const currentError = useAuthStore.getState().error;
      toast.error('Login failed', {
        description: currentError || 'Invalid credentials. Please try again.',
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Unified section with gradient and animation */}
      <div
        className="hidden lg:block lg:w-1/2 relative overflow-hidden min-h-screen"
        style={{
          background: 'linear-gradient(180deg, #fee2e2 0%, #fef2f2 50%, #ffffff 100%)'
        }}
      >
        {/* Full gradient overlay to ensure uniformity */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #fee2e2 0%, #fef2f2 50%, #ffffff 100%)'
          }}
        />

        {/* Branding content */}
        <div className="relative z-20 p-8 pb-52 h-full flex flex-col">
          {/* Main content */}
          <div className="max-w-lg mt-6">
            <h2 className="text-3xl font-bold text-gray-800 leading-snug">
              Department of Fisheries,
            </h2>
            <h2 className="text-3xl font-bold text-gray-800 mb-5">
              Government of Maharashtra
            </h2>
            <p className="text-gray-600 text-base leading-relaxed">
              Drone-based Surveillance & Digital data maintenance to enforce Maharashtra Marine Fishing Regulation (Amendment) Act, 2021 in Maharashtra.
            </p>
          </div>
        </div>

        {/* Ship Animation - Positioned at bottom with transparent bg */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
          style={{ mixBlendMode: 'multiply' }}
        >
          <Lottie
            animationData={shipAnimation}
            loop={true}
            style={{
              width: '100%',
              height: 'auto',
            }}
          />
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50/50">
        <div className="w-full max-w-md">
          {/* Logo and branding centered above login form */}
          <div className="flex flex-col items-center mb-6">
            <Image
              src="/icon-schnell.jpg"
              alt="Schnell Logo"
              width={120}
              height={45}
              className="object-contain"
              priority
            />
            <h1 className="text-xl font-bold text-gray-800 mt-3">Schnell Drone</h1>
            <p className="text-gray-500 text-sm mt-1">Surveillance & Monitoring System</p>
          </div>

          {/* Login Box */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Sign in</h2>
              <p className="text-gray-500 text-sm mt-1">Enter your credentials to continue</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="userId" className="text-gray-700 text-sm">User ID</Label>
                <Input
                  id="userId"
                  placeholder="Enter your user ID"
                  className="h-11 bg-gray-50 border-gray-200 rounded-lg focus:bg-white focus:border-gray-300"
                  {...register('userId')}
                  disabled={isLoading}
                />
                {errors.userId && (
                  <p className="text-sm text-red-500">{errors.userId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="h-11 pr-10 bg-gray-50 border-gray-200 rounded-lg focus:bg-white focus:border-gray-300"
                    {...register('password')}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-medium text-white rounded-lg mt-2"
                style={{ backgroundColor: '#dc2626' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              Protected government system. Unauthorized access is prohibited.
            </p>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-gray-400">
            Drone Surveillance Dashboard v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
