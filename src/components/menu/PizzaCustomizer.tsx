import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product, PizzaSize, ProductExtra } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';

interface PizzaCustomizerProps {
  item: Product;
  pizzaSizes: PizzaSize[];
  pizzaExtras: ProductExtra[];
  allPizzas: Product[];
  onClose: () => void;
}

export function PizzaCustomizer({ item, pizzaSizes, pizzaExtras, allPizzas, onClose }: PizzaCustomizerProps) {
  const { addItem } = useCart();
  const [sizeId, setSizeId] = useState(pizzaSizes.find(s => s.name === 'grande')?.id || pizzaSizes[0]?.id || '');
  const [twoFlavors, setTwoFlavors] = useState(false);
  const [secondFlavor, setSecondFlavor] = useState<Product | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<ProductExtra[]>([]);
  const [observations, setObservations] = useState('');

  const sizeOption = pizzaSizes.find(s => s.id === sizeId);
  const multiplier = sizeOption ? Number(sizeOption.price_multiplier) : 1;
  
  const basePrice = item.promo_price ? Number(item.promo_price) : Number(item.price);
  const secondPrice = secondFlavor ? (secondFlavor.promo_price ? Number(secondFlavor.promo_price) : Number(secondFlavor.price)) : 0;
  const pizzaPrice = twoFlavors && secondFlavor
    ? Math.max(basePrice, secondPrice) * multiplier
    : basePrice * multiplier;
  const extrasTotal = selectedExtras.reduce((sum, e) => sum + Number(e.price), 0);
  const totalPrice = pizzaPrice + extrasTotal;

  const toggleExtra = (extra: ProductExtra) => {
    setSelectedExtras(prev =>
      prev.find(e => e.id === extra.id) ? prev.filter(e => e.id !== extra.id) : [...prev, extra]
    );
  };

  const formatPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleAdd = () => {
    addItem({
      id: '',
      productId: item.id,
      productName: item.name,
      productImage: item.image_url || '',
      quantity: 1,
      size: sizeOption?.name,
      secondFlavorId: twoFlavors && secondFlavor ? secondFlavor.id : undefined,
      secondFlavorName: twoFlavors && secondFlavor ? secondFlavor.name : undefined,
      extras: selectedExtras.map(e => ({ id: e.id, name: e.name, price: Number(e.price) })),
      observations,
      unitPrice: totalPrice,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-card w-full sm:max-w-md sm:rounded-xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="relative h-40 overflow-hidden rounded-t-2xl sm:rounded-t-xl">
            {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
            <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full bg-card/80 text-foreground">
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-4">
              <h3 className="font-heading text-lg font-bold text-foreground">{item.name}</h3>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </div>

          <div className="p-4 space-y-5">
            {/* Size */}
            <div>
              <h4 className="font-heading font-semibold text-sm text-foreground mb-2">Tamanho</h4>
              <div className="grid grid-cols-2 gap-2">
                {pizzaSizes.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSizeId(s.id)}
                    className={`p-2.5 rounded-lg border text-sm transition-all ${
                      sizeId === s.id ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <span className="font-medium">{s.label}</span>
                    <span className="text-xs block text-muted-foreground">{s.slices} fatias</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Two flavors */}
            {item.allow_two_flavors && (
              <div>
                <button
                  onClick={() => { setTwoFlavors(!twoFlavors); setSecondFlavor(null); }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                    twoFlavors ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <span className="text-sm font-medium text-foreground">Meio a meio (2 sabores)</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    twoFlavors ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`}>
                    {twoFlavors && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                </button>

                {twoFlavors && (
                  <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                    {allPizzas.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSecondFlavor(p)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-all ${
                          secondFlavor?.id === p.id
                            ? 'bg-primary/10 border border-primary'
                            : 'bg-secondary hover:bg-secondary/80 border border-transparent'
                        }`}
                      >
                        {p.image_url && <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded object-cover" />}
                        <span className="flex-1 font-medium text-foreground">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{formatPrice(Number(p.price))}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Extras */}
            {pizzaExtras.length > 0 && (
              <div>
                <h4 className="font-heading font-semibold text-sm text-foreground mb-2">Extras</h4>
                <div className="space-y-1.5">
                  {pizzaExtras.map(extra => (
                    <button
                      key={extra.id}
                      onClick={() => toggleExtra(extra)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-sm transition-all ${
                        selectedExtras.find(e => e.id === extra.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-foreground">{extra.name}</span>
                      <span className="text-muted-foreground">+{formatPrice(Number(extra.price))}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Observations */}
            <div>
              <h4 className="font-heading font-semibold text-sm text-foreground mb-2">Observações</h4>
              <textarea
                value={observations}
                onChange={e => setObservations(e.target.value)}
                placeholder="Ex: sem cebola, bem assada..."
                className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground resize-none h-16 focus:outline-none focus:border-primary"
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={twoFlavors && !secondFlavor}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Adicionar • {formatPrice(totalPrice)}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
