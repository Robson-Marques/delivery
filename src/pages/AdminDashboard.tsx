import { useState } from 'react';
import { useOrders, type OrderStatus } from '@/contexts/OrderContext';
import { ArrowLeft, ChefHat, Truck, BarChart3, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KanbanBoard } from '@/components/admin/KanbanBoard';
import { DashboardStats } from '@/components/admin/DashboardStats';

type AdminView = 'dashboard' | 'orders' | 'kitchen';

export default function AdminDashboard() {
  const [view, setView] = useState<AdminView>('orders');
  const navigate = useNavigate();

  const navItems: { id: AdminView; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'orders', label: 'Pedidos', icon: <Home className="w-4 h-4" /> },
    { id: 'kitchen', label: 'Cozinha', icon: <ChefHat className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center gap-3 h-14 px-4">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-heading font-bold text-foreground">Painel Administrativo</h1>
        </div>
        <div className="flex border-b border-border">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                view === item.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.icon}
              {item.label}
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
