import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { z } from 'zod';
import { Mail } from 'lucide-react';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  confirmPassword: z.string().min(6, 'Password confirmation required').max(100)
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(100)
});

export default function Auth() {
  const { signUp, signIn, signInWithGoogle, user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: '',
    phone: '',
    otp: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already authenticated
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = signUpSchema.parse(formData);
      
      const { error } = await signUp(
        validatedData.email,
        validatedData.password,
        validatedData.fullName
      );

      if (error) {
        toast.error(error.message || 'Sign up failed');
      } else {
        toast.success('Account created! Please check your email for verification.');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path && err.path.length > 0) {
            fieldErrors[String(err.path[0])] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = signInSchema.parse({
        email: formData.email,
        password: formData.password
      });

      const { error } = await signIn(validatedData.email, validatedData.password);

      if (error) {
        toast.error(error.message || 'Sign in failed');
      } else {
        toast.success('Welcome back!');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path && err.path.length > 0) {
            fieldErrors[String(err.path[0])] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error.message || 'Google sign-in failed');
      } else {
        toast.success('Redirecting to Google...');
      }
    } finally {
      setIsSubmitting(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-warm-bg to-primary/5 p-4">
      <div className="flex-grow flex items-center justify-center">
        <Card className="w-full max-w-md shadow-warm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
            FRUNKO.in
          </CardTitle>
          <CardDescription>
            Your favorite meals, delivered fresh
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">
                <Mail className="h-4 w-4 mr-1" />
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            {/* Email Sign In */}
            <TabsContent value="signin" className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 533.5 544.3" aria-hidden="true">
                  <path fill="#EA4335" d="M533.5 278.4c0-18.5-1.7-37-5.2-54.8H272.1v103.8h147.1c-6.3 34.6-25.4 64-54.2 83.6v69.4h87.7c51.4-47.4 80.8-117.3 80.8-202z"/>
                  <path fill="#34A853" d="M272.1 544.3c73.2 0 134.7-24.1 179.6-65.3l-87.7-69.4c-24.4 16.4-55.7 26.1-91.9 26.1-70.6 0-130.5-47.6-152-111.5H30.8v70.4c44.4 88 135.7 149.7 241.3 149.7z"/>
                  <path fill="#4A90E2" d="M120.1 324.2c-10.7-31.9-10.7-66.2 0-98.1v-70.4H30.8c-44.5 88.9-44.5 193.9 0 282.8l89.3-70.4z"/>
                  <path fill="#FBBC05" d="M272.1 106.9c38.8-.6 76.2 13.4 105 39.3l78.5-78.5C406.4 24.4 344.9 0 272.1 0 166.5 0 75.2 61.7 30.8 149.7l89.3 70.4c21.5-63.9 81.4-111.5 152-111.5z"/>
                </svg>
                Continue with Google
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            {/* Sign Up */}
            <TabsContent value="signup" className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 533.5 544.3" aria-hidden="true">
                  <path fill="#EA4335" d="M533.5 278.4c0-18.5-1.7-37-5.2-54.8H272.1v103.8h147.1c-6.3 34.6-25.4 64-54.2 83.6v69.4h87.7c51.4-47.4 80.8-117.3 80.8-202z"/>
                  <path fill="#34A853" d="M272.1 544.3c73.2 0 134.7-24.1 179.6-65.3l-87.7-69.4c-24.4 16.4-55.7 26.1-91.9 26.1-70.6 0-130.5-47.6-152-111.5H30.8v70.4c44.4 88 135.7 149.7 241.3 149.7z"/>
                  <path fill="#4A90E2" d="M120.1 324.2c-10.7-31.9-10.7-66.2 0-98.1v-70.4H30.8c-44.5 88.9-44.5 193.9 0 282.8l89.3-70.4z"/>
                  <path fill="#FBBC05" d="M272.1 106.9c38.8-.6 76.2 13.4 105 39.3l78.5-78.5C406.4 24.4 344.9 0 272.1 0 166.5 0 75.2 61.7 30.8 149.7l89.3 70.4c21.5-63.9 81.4-111.5 152-111.5z"/>
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or sign up with email</span>
                </div>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
      <footer className="mt-4 p-4">
        <p className="text-center text-sm text-muted-foreground">
          © 2025 All Rights Reserved | Made by{' '}
          <a href="https://logisaar.in" target="_blank" className="text-primary hover:underline">
            Logisaar
          </a>
        </p>
      </footer>
    </div>
  );
}
