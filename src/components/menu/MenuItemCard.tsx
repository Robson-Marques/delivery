import { Plus, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '@/lib/api';

interface MenuItemCardProps {
  item: Product;
  onAdd: (item: Product) => void;
}

export function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
  const formatPrice = (price: number) =>
    Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="menu-card flex gap-3 p-3"
    >
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-lg overflow-hidden">
        {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
        {item.promo_price && (
          <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-primary text-primary-foreground">
            PROMO
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className="font-heading font-semibold text-sm text-foreground leading-tight">{item.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
          {item.prep_time_min > 0 && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{item.prep_time_min} min</span>
            </div>
          )}
        </div>

        <div className="flex items-end justify-between mt-2">
          <div>
            {item.promo_price ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs text-muted-foreground line-through">{formatPrice(Number(item.price))}</span>
                <span className="text-sm font-bold text-primary">{formatPrice(Number(item.promo_price))}</span>
              </div>
            ) : (
              <span className="text-sm font-bold text-foreground">
                {item.is_pizza ? `a partir de ${formatPrice(Number(item.price) * 0.6)}` : formatPrice(Number(item.price))}
              </span>
            )}
          </div>

          <button
            onClick={() => onAdd(item)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
