import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { Receipt, Mail, Lock, User, Building, Eye, EyeOff, Shield, Loader2 } from 'lucide-react';

type AuthMode = 'login' | 'register';

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  company?: string;
}

const loginSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

const registerSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .required('Full name is required'),
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  company: yup.string().optional(),
});

const AuthForm: React.FC = () => {
  const { login, register } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: 'onChange',
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    mode: 'onChange',
  });

  const currentForm = authMode === 'login' ? loginForm : registerForm;
  const isFormValid = currentForm.formState.isValid;

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back! Redirecting to dashboard...', {
        duration: 2000,
        icon: '🎉',
      });
    } catch (error) {
      toast.error('Invalid email or password. Please try again.', {
        duration: 4000,
        icon: '❌',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await register({
        name: data.name,
        email: data.email,
        password: data.password,
        company: data.company,
      });
      toast.success('Account created successfully! Welcome to InvoicePro!', {
        duration: 3000,
        icon: '🎉',
      });
    } catch (error) {
      toast.error('Registration failed. Please try again.', {
        duration: 4000,
        icon: '❌',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    loginForm.reset();
    registerForm.reset();
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const renderLoginForm = () => (
    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            {...loginForm.register('email')}
            type="email"
            id="email"
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
              loginForm.formState.errors.email
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
            placeholder="Enter your email"
          />
        </div>
        {loginForm.formState.errors.email && (
          <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            {...loginForm.register('password')}
            type={showPassword ? 'text' : 'password'}
            id="password"
            className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
              loginForm.formState.errors.password
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {loginForm.formState.errors.password && (
          <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isFormValid || isLoading}
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );

  const renderRegisterForm = () => (
    <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Full Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            {...registerForm.register('name')}
            type="text"
            id="name"
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
              registerForm.formState.errors.name
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
            placeholder="Enter your full name"
          />
        </div>
        {registerForm.formState.errors.name && (
          <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            {...registerForm.register('email')}
            type="email"
            id="email"
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
              registerForm.formState.errors.email
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
            placeholder="Enter your email"
          />
        </div>
        {registerForm.formState.errors.email && (
          <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
          Company Name (Optional)
        </label>
        <div className="relative">
          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            {...registerForm.register('company')}
            type="text"
            id="company"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            placeholder="Enter your company name"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            {...registerForm.register('password')}
            type={showPassword ? 'text' : 'password'}
            id="password"
            className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
              registerForm.formState.errors.password
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
            placeholder="Create a password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {registerForm.formState.errors.password && (
          <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            {...registerForm.register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
              registerForm.formState.errors.confirmPassword
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
            placeholder="Confirm your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {registerForm.formState.errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isFormValid || isLoading}
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Creating Account...
          </>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  );

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-xl mb-4 shadow-lg">
          <Receipt className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          {authMode === 'login' ? 'Welcome back' : 'Create Account'}
        </h1>
        <p className="text-gray-600 mt-2">
          {authMode === 'login' 
            ? 'Sign in to your InvoicePro account' 
            : 'Start managing your invoices today'
          }
        </p>
      </div>

      {/* Form */}
      {authMode === 'login' ? renderLoginForm() : renderRegisterForm()}

      {/* Demo credentials for login mode */}
      {authMode === 'login' && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">Demo User Credentials:</p>
            <p className="text-sm text-blue-700">
              Email: demo@invoicepro.com<br />
              Password: any password
            </p>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-800 font-medium">Admin Access:</p>
            </div>
            <p className="text-sm text-red-700">
              Email: admin@invoicepro.com<br />
              Password: admin123
            </p>
          </div>
        </div>
      )}

      {/* Toggle between login and register */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={toggleAuthMode}
            disabled={isLoading}
            className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors disabled:opacity-50"
          >
            {authMode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;