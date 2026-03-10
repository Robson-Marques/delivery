import { useState } from 'react';
import { ArrowLeft, ChefHat, BarChart3, Home, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KanbanBoard } from '@/components/admin/KanbanBoard';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { useAuth } from '@/contexts/AuthContext';

type AdminView = 'dashboard' | 'orders' | 'kitchen';

export default function AdminDashboard() {
  const [view, setView] = useState<AdminView>('orders');
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const navItems: { id: AdminView; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'orders', label: 'Pedidos', icon: <Home className="w-4 h-4" /> },
    { id: 'kitchen', label: 'Cozinha', icon: <ChefHat className="w-4 h-4" /> },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Faça login para acessar o painel</p>
        <button onClick={() => navigate('/login')} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          <LogIn className="w-4 h-4" /> Entrar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-1.5 rounded-full hover:bg-secondary">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="font-heading font-bold text-foreground">Painel Administrativo</h1>
          </div>
          <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground">Sair</button>
        </div>
        <div className="flex border-b border-border">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                view === item.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {item.icon}{item.label}
            </button>
          ))}
        </div>
      </header>
      <main className="container px-4 py-4">
        {view === 'dashboard' && <DashboardStats />}
        {view === 'orders' && <KanbanBoard />}
        {view === 'kitchen' && <KanbanBoard kitchenMode />}
      </main>
    </div>
  );
}
