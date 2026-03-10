import { ShoppingCart, Clock, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import logo from '@/assets/logo.png';

interface MenuHeaderProps {
  onCartClick: () => void;
}

export function MenuHeader({ onCartClick }: MenuHeaderProps) {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="w-8 h-8 rounded-full" />
          <div>
            <h1 className="font-heading font-bold text-sm leading-tight text-foreground">Pizza Express</h1>
            <div className="flex items-center gap-1 text-xs text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse-soft" />
              Aberto
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>18h-23h</span>
          </div>

          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-success/10 text-success hover:bg-success/20 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
          </a>

          <button
            onClick={onCartClick}
            className="relative p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            {itemCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center"
              >
                {itemCount}
              </motion.span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
