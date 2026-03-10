import { X, Minus, Plus, Trash2, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, coupon, applyCoupon, removeCoupon, subtotal, discount, deliveryFee, total } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const navigate = useNavigate();

  const formatPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    await applyCoupon(couponInput);
    setCouponInput('');
    setApplyingCoupon(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-full sm:max-w-sm bg-card shadow-xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-heading font-bold text-lg text-foreground">Carrinho</h2>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🛒</p>
                  <p className="text-muted-foreground text-sm">Seu carrinho está vazio</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="bg-secondary/50 rounded-lg p-3">
                    <div className="flex gap-2">
                      {item.productImage && (
                        <img src={item.productImage} alt={item.productName} className="w-14 h-14 rounded-lg object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground truncate">{item.productName}</h4>
                        {item.size && <span className="text-xs text-muted-foreground capitalize">{item.size}</span>}
                        {item.secondFlavorName && <span className="text-xs text-muted-foreground"> + {item.secondFlavorName}</span>}
                        {item.extras.length > 0 && (
                          <p className="text-xs text-muted-foreground">{item.extras.map(e => e.name).join(', ')}</p>
                        )}
                        {item.observations && <p className="text-xs text-muted-foreground italic">"{item.observations}"</p>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-foreground">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium text-foreground w-5 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-foreground">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{formatPrice(item.unitPrice * item.quantity)}</span>
                        <button onClick={() => removeItem(item.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-border p-4 space-y-3">
                {!coupon ? (
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        value={couponInput}
                        onChange={e => setCouponInput(e.target.value)}
                        placeholder="Cupom de desconto"
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    <button
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon}
                      className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                    >
                      Aplicar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-success/10 rounded-lg px-3 py-2">
                    <span className="text-xs font-medium text-success">🎉 Cupom {coupon.code} aplicado!</span>
                    <button onClick={removeCoupon} className="text-xs text-destructive">Remover</button>
                  </div>
                )}

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Entrega</span><span>{formatPrice(deliveryFee)}</span></div>
                  {discount > 0 && <div className="flex justify-between text-success"><span>Desconto</span><span>-{formatPrice(discount)}</span></div>}
                  <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border"><span>Total</span><span>{formatPrice(total)}</span></div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm hover:bg-primary/90 transition-colors"
                >
                  Finalizar Pedido
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
