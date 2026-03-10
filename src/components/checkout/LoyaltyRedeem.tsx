import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useQuery } from '@tanstack/react-query';
import { Award, Minus, Plus } from 'lucide-react';

interface LoyaltyRedeemProps {
  customerPhone: string;
}

export function LoyaltyRedeem({ customerPhone }: LoyaltyRedeemProps) {
  const { loyaltyPointsUsed, applyLoyaltyPoints, removeLoyaltyPoints, subtotal } = useCart();
  const [pointsToUse, setPointsToUse] = useState(0);

  const { data: customer } = useQuery({
    queryKey: ['customer-loyalty', customerPhone],
    queryFn: async () => {
      if (!customerPhone || customerPhone.length < 8) return null;
      const { data } = await supabase.from('customers').select('id, loyalty_points, name')
        .eq('phone', customerPhone).maybeSingle();
      return data;
    },
    enabled: customerPhone.length >= 8,
  });

  if (!customer || customer.loyalty_points <= 0) return null;

  const maxPoints = Math.min(customer.loyalty_points, Math.floor(subtotal * 10)); // max discount = subtotal
  const discountValue = pointsToUse / 10;
  const formatPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleApply = () => {
    if (pointsToUse > 0) {
      applyLoyaltyPoints(pointsToUse);
    }
  };

  if (loyaltyPointsUsed > 0) {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          <div>
            <p className="text-xs font-medium text-foreground">{loyaltyPointsUsed} pontos usados</p>
            <p className="text-xs text-success">-{formatPrice(loyaltyPointsUsed / 10)} de desconto</p>
          </div>
        </div>
        <button onClick={removeLoyaltyPoints} className="text-xs text-destructive hover:underline">Remover</button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Award className="w-4 h-4 text-primary" />
        <p className="text-sm font-medium text-foreground">Programa de Fidelidade</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Você tem <span className="font-bold text-primary">{customer.loyalty_points}</span> pontos disponíveis (10 pts = R$ 1,00)
      </p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setPointsToUse(Math.max(0, pointsToUse - 10))}
            className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center">
            <Minus className="w-3 h-3 text-foreground" />
          </button>
          <span className="text-sm font-bold text-foreground w-16 text-center">{pointsToUse} pts</span>
          <button onClick={() => setPointsToUse(Math.min(maxPoints, pointsToUse + 10))}
            className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center">
            <Plus className="w-3 h-3 text-foreground" />
          </button>
        </div>
        {pointsToUse > 0 && (
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-success">-{formatPrice(discountValue)}</span>
            <button onClick={handleApply}
              className="ml-auto px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">
              Usar pontos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
