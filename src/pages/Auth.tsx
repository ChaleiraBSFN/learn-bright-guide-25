import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Lock, Loader2, User, Calendar, Globe, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { LanguageSelector } from '@/components/LanguageSelector';
import { supabase } from '@/integrations/supabase/client';
import learnBuddyLogo from '@/assets/learn-buddy-logo.jpeg';

const countries = [
  { code: 'BR', name: 'Brasil' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'PT', name: 'Portugal' },
  { code: 'ES', name: 'Espanha' },
  { code: 'AR', name: 'Argentina' },
  { code: 'MX', name: 'México' },
  { code: 'CO', name: 'Colômbia' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Peru' },
  { code: 'UY', name: 'Uruguai' },
  { code: 'PY', name: 'Paraguai' },
  { code: 'BO', name: 'Bolívia' },
  { code: 'EC', name: 'Equador' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'OTHER', name: 'Outro' },
];

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  birthDate?: string;
  country?: string;
}

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const loginSchema = z.object({
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(1, t('auth.passwordRequired')),
  });

  const signupSchema = z.object({
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(1, t('auth.passwordRequired')),
    confirmPassword: z.string().min(1, t('auth.passwordRequired')),
    firstName: z.string().min(1, t('auth.firstNameMinLength')),
    lastName: z.string().min(1, t('auth.lastNameMinLength')),
    displayName: z.string().min(1, t('auth.nameMinLength')).max(50, t('auth.nameMaxLength')),
    birthDate: z.string().min(1, t('auth.birthDateRequired')),
    country: z.string().min(1, t('auth.countryRequired')),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.passwordsDoNotMatch'),
    path: ['confirmPassword'],
  });

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateForm = () => {
    try {
      if (isLogin) {
        loginSchema.parse({ email, password });
      } else {
        signupSchema.parse({ email, password, confirmPassword, firstName, lastName, displayName, birthDate, country });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: FormErrors = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof FormErrors;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: t('auth.loginError'),
            description: t('auth.invalidCredentials'),
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('auth.welcome'),
            description: t('auth.loginSuccess'),
          });
          navigate('/');
        }
      } else {
        // Use edge function to create user (bypasses password strength checks)
        let createResponse: any;
        try {
          const { data, error: fnError } = await supabase.functions.invoke('create-user', {
            body: {
              email,
              password,
              data: {
                display_name: displayName,
                first_name: firstName,
                last_name: lastName,
                birth_date: birthDate,
                country: country,
              },
            },
          });
          
          if (fnError) {
            throw new Error(fnError.message || 'Function error');
          }
          
          createResponse = data;
        } catch (err: any) {
          console.error('Create user error:', err);
          toast({
            title: t('auth.signupError'),
            description: t('auth.signupGenericError'),
            variant: 'destructive',
          });
          return;
        }

        if (createResponse?.error) {
          const errorMsg = String(createResponse.error).toLowerCase();
          if (errorMsg.includes('already') || errorMsg.includes('registered')) {
            toast({
              title: t('auth.signupError'),
              description: t('auth.userAlreadyExists'),
              variant: 'destructive',
            });
          } else {
            toast({
              title: t('auth.signupError'),
              description: t('auth.signupGenericError'),
              variant: 'destructive',
            });
          }
          return;
        }

        // User created successfully, now sign them in
        try {
          const { error: signInError } = await signIn(email, password);
          if (signInError) {
            // Account was created but auto-login failed - still show success
            console.warn('Auto-login after signup failed:', signInError.message);
            toast({
              title: t('auth.accountCreated'),
              description: t('auth.accountCreatedSuccess'),
            });
            setIsLogin(true);
          } else {
            toast({
              title: t('auth.accountCreated'),
              description: t('auth.accountCreatedSuccess'),
            });
            navigate('/');
          }
        } catch (signInErr) {
          console.warn('Auto-login exception:', signInErr);
          toast({
            title: t('auth.accountCreated'),
            description: t('auth.accountCreatedSuccess'),
          });
          setIsLogin(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={learnBuddyLogo} 
              alt="Learn Buddy" 
              className="h-14 w-14 rounded-xl object-cover"
            />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">{t('header.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? t('auth.loginToAccount') : t('auth.createAccount')}
          </p>
        </div>

        <div className="card-elevated p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder={t('auth.firstNamePlaceholder')}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-sm text-destructive">{errors.firstName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder={t('auth.lastNamePlaceholder')}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={loading}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">{t('auth.displayName')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="displayName"
                      type="text"
                      placeholder={t('auth.displayNamePlaceholder')}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  {errors.displayName && (
                    <p className="text-sm text-destructive">{errors.displayName}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">{t('auth.birthDate')}</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="birthDate"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                    {errors.birthDate && (
                      <p className="text-sm text-destructive">{errors.birthDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">{t('auth.country')}</Label>
                    <Select value={country} onValueChange={setCountry} disabled={loading}>
                      <SelectTrigger className="w-full">
                        <Globe className="h-4 w-4 text-muted-foreground mr-2" />
                        <SelectValue placeholder={t('auth.selectCountry')} />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.country && (
                      <p className="text-sm text-destructive">{errors.country}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{isLogin ? t('auth.password') : t('auth.createPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
              <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLogin ? (
                t('auth.login')
              ) : (
                t('auth.signup')
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {isLogin && (
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                {t('auth.forgotPassword')}
              </button>
            )}
            <div>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:underline"
              >
                {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
