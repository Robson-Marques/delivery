import { motion } from 'framer-motion';
import heroPizza from '@/assets/hero-pizza.jpg';

export function HeroBanner() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative h-48 sm:h-56 overflow-hidden"
    >
      <img
        src={heroPizza}
        alt="Pizza artesanal"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="inline-block px-3 py-1 mb-2 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
            🔥 Promoção do dia
          </span>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
            2 Pizzas Grandes por R$79,90
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Aproveite! Válido apenas hoje</p>
        </motion.div>
      </div>
    </motion.section>
  );
}
