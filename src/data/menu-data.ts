export type PizzaSize = 'pequena' | 'media' | 'grande' | 'gigante';

export interface PizzaSizeOption {
  id: PizzaSize;
  label: string;
  slices: number;
  priceMultiplier: number;
}

export interface Extra {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  promoPrice?: number;
  image: string;
  prepTime: number; // minutes
  isPizza?: boolean;
  sizes?: PizzaSizeOption[];
  extras?: Extra[];
  allowTwoFlavors?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export const categories: Category[] = [
  { id: 'pizzas', name: 'Pizzas', icon: '🍕' },
  { id: 'lanches', name: 'Lanches', icon: '🍔' },
  { id: 'porcoes', name: 'Porções', icon: '🍟' },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤' },
  { id: 'promocoes', name: 'Promoções', icon: '🔥' },
];

export const pizzaSizes: PizzaSizeOption[] = [
  { id: 'pequena', label: 'Pequena', slices: 4, priceMultiplier: 0.6 },
  { id: 'media', label: 'Média', slices: 6, priceMultiplier: 0.8 },
  { id: 'grande', label: 'Grande', slices: 8, priceMultiplier: 1 },
  { id: 'gigante', label: 'Gigante', slices: 12, priceMultiplier: 1.3 },
];

export const pizzaExtras: Extra[] = [
  { id: 'borda-catupiry', name: 'Borda Catupiry', price: 8 },
  { id: 'borda-cheddar', name: 'Borda Cheddar', price: 8 },
  { id: 'borda-chocolate', name: 'Borda Chocolate', price: 10 },
  { id: 'extra-queijo', name: 'Extra Queijo', price: 5 },
  { id: 'extra-bacon', name: 'Extra Bacon', price: 6 },
];

export const menuItems: MenuItem[] = [
  // Pizzas
  {
    id: 'pizza-margherita',
    category: 'pizzas',
    name: 'Margherita',
    description: 'Molho de tomate, mussarela, tomate e manjericão fresco',
    price: 45.90,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
    prepTime: 25,
    isPizza: true,
    sizes: pizzaSizes,
    extras: pizzaExtras,
    allowTwoFlavors: true,
  },
  {
    id: 'pizza-calabresa',
    category: 'pizzas',
    name: 'Calabresa',
    description: 'Molho de tomate, mussarela, calabresa fatiada e cebola',
    price: 42.90,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
    prepTime: 25,
    isPizza: true,
    sizes: pizzaSizes,
    extras: pizzaExtras,
    allowTwoFlavors: true,
  },
  {
    id: 'pizza-4queijos',
    category: 'pizzas',
    name: 'Quatro Queijos',
    description: 'Mussarela, provolone, parmesão e gorgonzola',
    price: 52.90,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop',
    prepTime: 25,
    isPizza: true,
    sizes: pizzaSizes,
    extras: pizzaExtras,
    allowTwoFlavors: true,
  },
  {
    id: 'pizza-frango',
    category: 'pizzas',
    name: 'Frango com Catupiry',
    description: 'Molho de tomate, mussarela, frango desfiado e catupiry',
    price: 48.90,
    image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400&h=300&fit=crop',
    prepTime: 25,
    isPizza: true,
    sizes: pizzaSizes,
    extras: pizzaExtras,
    allowTwoFlavors: true,
  },
  {
    id: 'pizza-portuguesa',
    category: 'pizzas',
    name: 'Portuguesa',
    description: 'Mussarela, presunto, ovo, cebola, azeitona e ervilha',
    price: 46.90,
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=300&fit=crop',
    prepTime: 30,
    isPizza: true,
    sizes: pizzaSizes,
    extras: pizzaExtras,
    allowTwoFlavors: true,
  },
  {
    id: 'pizza-pepperoni',
    category: 'pizzas',
    name: 'Pepperoni',
    description: 'Molho de tomate, mussarela e pepperoni importado',
    price: 49.90,
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop',
    prepTime: 25,
    isPizza: true,
    sizes: pizzaSizes,
    extras: pizzaExtras,
    allowTwoFlavors: true,
  },
  // Lanches
  {
    id: 'lanche-classico',
    category: 'lanches',
    name: 'X-Burguer Clássico',
    description: 'Pão brioche, hambúrguer 180g, queijo, alface, tomate e molho especial',
    price: 28.90,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
    prepTime: 15,
  },
  {
    id: 'lanche-bacon',
    category: 'lanches',
    name: 'X-Bacon Duplo',
    description: 'Pão brioche, 2 hambúrgueres, bacon crocante, cheddar e molho barbecue',
    price: 36.90,
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop',
    prepTime: 20,
  },
  {
    id: 'lanche-smash',
    category: 'lanches',
    name: 'Smash Burger',
    description: 'Pão potato, smash burger 120g, cheddar derretido e cebola caramelizada',
    price: 32.90,
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop',
    prepTime: 15,
  },
  // Porções
  {
    id: 'porcao-batata',
    category: 'porcoes',
    name: 'Batata Frita',
    description: 'Porção generosa de batatas fritas crocantes com sal e orégano',
    price: 22.90,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
    prepTime: 10,
  },
  {
    id: 'porcao-onion',
    category: 'porcoes',
    name: 'Onion Rings',
    description: 'Anéis de cebola empanados e fritos, acompanha molho ranch',
    price: 24.90,
    image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop',
    prepTime: 12,
  },
  {
    id: 'porcao-nuggets',
    category: 'porcoes',
    name: 'Chicken Nuggets',
    description: '12 nuggets de frango crocantes com molho barbecue',
    price: 26.90,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=300&fit=crop',
    prepTime: 12,
  },
  // Bebidas
  {
    id: 'bebida-coca',
    category: 'bebidas',
    name: 'Coca-Cola 600ml',
    description: 'Refrigerante Coca-Cola gelado',
    price: 8.90,
    image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop',
    prepTime: 0,
  },
  {
    id: 'bebida-suco',
    category: 'bebidas',
    name: 'Suco Natural',
    description: 'Suco natural de laranja, limão ou maracujá - 500ml',
    price: 12.90,
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop',
    prepTime: 5,
  },
  {
    id: 'bebida-agua',
    category: 'bebidas',
    name: 'Água Mineral 500ml',
    description: 'Água mineral sem gás',
    price: 4.90,
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop',
    prepTime: 0,
  },
  // Promoções
  {
    id: 'promo-combo1',
    category: 'promocoes',
    name: 'Combo Pizza + Refri',
    description: 'Pizza Grande + Coca-Cola 2L. Economize R$15!',
    price: 69.90,
    promoPrice: 54.90,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
    prepTime: 25,
  },
  {
    id: 'promo-combo2',
    category: 'promocoes',
    name: 'Combo Lanche Duplo',
    description: '2 X-Burguers + Batata Frita + 2 Refrigerantes',
    price: 89.90,
    promoPrice: 69.90,
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop',
    prepTime: 20,
  },
];
