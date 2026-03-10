import { useState } from 'react';
import { MenuHeader } from '@/components/menu/MenuHeader';
import { HeroBanner } from '@/components/menu/HeroBanner';
import { CategoryBar } from '@/components/menu/CategoryBar';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { PizzaCustomizer } from '@/components/menu/PizzaCustomizer';
import { CartDrawer } from '@/components/menu/CartDrawer';
import { menuItems, type MenuItem } from '@/data/menu-data';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('pizzas');
  const [selectedPizza, setSelectedPizza] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const { addItem, itemCount, total } = useCart();

  const filteredItems = menuItems.filter(item => item.category === activeCategory);

  const handleAddItem = (item: MenuItem) => {
    if (item.isPizza) {
      setSelectedPizza(item);
    } else {
      addItem({
        id: '',
        menuItem: item,
        quantity: 1,
        extras: [],
        observations: '',
        unitPrice: item.promoPrice || item.price,
      });
    }
  };

  const formatPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="min-h-screen bg-background pb-20">
      <MenuHeader onCartClick={() => setCartOpen(true)} />
      <HeroBanner />
      <CategoryBar activeCategory={activeCategory} onSelect={setActiveCategory} />

      <main className="container px-4 py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredItems.map(item => (
            <MenuItemCard key={item.id} item={item} onAdd={handleAddItem} />
          ))}
        </div>
        {filteredItems.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Nenhum item nesta categoria</p>
        )}
      </main>

      {/* Floating cart bar */}
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-card/95 backdrop-blur-md border-t border-border"
        >
          <button
            onClick={() => setCartOpen(true)}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
            </div>
            <span>{formatPrice(total)}</span>
          </button>
        </motion.div>
      )}

      {selectedPizza && (
        <PizzaCustomizer item={selectedPizza} onClose={() => setSelectedPizza(null)} />
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
