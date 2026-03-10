import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MenuHeader } from '@/components/menu/MenuHeader';
import { HeroBanner } from '@/components/menu/HeroBanner';
import { CategoryBar } from '@/components/menu/CategoryBar';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { PizzaCustomizer } from '@/components/menu/PizzaCustomizer';
import { CartDrawer } from '@/components/menu/CartDrawer';
import { fetchCategories, fetchProducts, fetchPizzaSizes, fetchProductExtras, type Product } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';
import { ShoppingCart, Loader2 } from 'lucide-react';

export default function MenuPage() {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedPizza, setSelectedPizza] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const { addItem, itemCount, total } = useCart();

  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const activeCategory = activeCategoryId || categories[0]?.id || '';

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products', activeCategory],
    queryFn: () => fetchProducts(activeCategory),
    enabled: !!activeCategory,
  });

  const { data: pizzaSizes = [] } = useQuery({
    queryKey: ['pizza-sizes'],
    queryFn: fetchPizzaSizes,
  });

  const { data: pizzaExtras = [] } = useQuery({
    queryKey: ['pizza-extras'],
    queryFn: () => fetchProductExtras(true),
  });

  const handleAddItem = (item: Product) => {
    if (item.is_pizza) {
      setSelectedPizza(item);
    } else {
      addItem({
        id: '',
        productId: item.id,
        productName: item.name,
        productImage: item.image_url || '',
        quantity: 1,
        extras: [],
        observations: '',
        unitPrice: item.promo_price ? Number(item.promo_price) : Number(item.price),
      });
    }
  };

  const formatPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const isLoading = loadingCats || loadingProducts;

  return (
    <div className="min-h-screen bg-background pb-20">
      <MenuHeader onCartClick={() => setCartOpen(true)} />
      <HeroBanner />
      <CategoryBar
        categories={categories}
        activeCategory={activeCategory}
        onSelect={setActiveCategoryId}
      />

      <main className="container px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {products.map(item => (
              <MenuItemCard key={item.id} item={item} onAdd={handleAddItem} />
            ))}
          </div>
        )}
        {!isLoading && products.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Nenhum item nesta categoria</p>
        )}
      </main>

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
        <PizzaCustomizer
          item={selectedPizza}
          pizzaSizes={pizzaSizes}
          pizzaExtras={pizzaExtras}
          allPizzas={products.filter(p => p.is_pizza && p.id !== selectedPizza.id)}
          onClose={() => setSelectedPizza(null)}
        />
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
