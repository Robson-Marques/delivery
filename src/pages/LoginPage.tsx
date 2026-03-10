import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, displayName);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Conta criada! Verifique seu email para confirmar.');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error('Email ou senha incorretos');
      } else {
        toast.success('Login realizado!');
        navigate('/admin');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-lg border border-border p-6 w-full max-w-sm"
      >
        <button onClick={() => navigate('/')} className="p-1.5 rounded-full hover:bg-secondary mb-4">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>

        <div className="text-center mb-6">
          <img src={logo} alt="Logo" className="w-14 h-14 rounded-full mx-auto mb-3" />
          <h1 className="font-heading text-xl font-bold text-foreground">
            {isSignUp ? 'Criar conta' : 'Entrar no painel'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignUp ? 'Crie sua conta para gerenciar' : 'Acesse o painel administrativo'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Nome completo"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          )}

          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Senha"
              required
              minLength={6}
              className="w-full p-2.5 pr-10 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {!isSignUp && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="rounded border-border"
              />
              Lembrar login
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Carregando...' : isSignUp ? 'Criar conta' : 'Entrar'}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-primary hover:underline"
          >
            {isSignUp ? 'Já tem conta? Entrar' : 'Criar nova conta'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
