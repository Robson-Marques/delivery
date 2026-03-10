import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchCategories, fetchProducts, type Product, type Category } from '@/lib/api';
import { Plus, Pencil, Trash2, Search, X, Save, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductForm {
  name: string;
  description: string;
  price: string;
  promo_price: string;
  category_id: string;
  image_url: string;
  is_pizza: boolean;
  allow_two_flavors: boolean;
  prep_time_min: string;
  is_active: boolean;
  sort_order: string;
}

const emptyForm: ProductForm = {
  name: '', description: '', price: '', promo_price: '', category_id: '',
  image_url: '', is_pizza: false, allow_two_flavors: false,
  prep_time_min: '15', is_active: true, sort_order: '0',
};

export function ProductManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const { data: categories = [] } = useQuery({ queryKey: ['categories-all'], queryFn: fetchCategories });
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => fetchProducts(),
  });

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || p.category_id === filterCategory;
    return matchSearch && matchCat;
  });

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p.id);
    setForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      promo_price: p.promo_price ? String(p.promo_price) : '',
      category_id: p.category_id || '',
      image_url: p.image_url || '',
      is_pizza: p.is_pizza,
      allow_two_flavors: p.allow_two_flavors,
      prep_time_min: String(p.prep_time_min),
      is_active: p.is_active,
      sort_order: String(p.sort_order),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error('Nome e preço são obrigatórios');
      return;
    }
    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      promo_price: form.promo_price ? parseFloat(form.promo_price) : null,
      category_id: form.category_id || null,
      image_url: form.image_url || null,
      is_pizza: form.is_pizza,
      allow_two_flavors: form.allow_two_flavors,
      prep_time_min: parseInt(form.prep_time_min) || 15,
      is_active: form.is_active,
      sort_order: parseInt(form.sort_order) || 0,
    };

    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success('Produto atualizado!');
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) { toast.error('Erro ao criar'); return; }
      toast.success('Produto criado!');
    }
    queryClient.invalidateQueries({ queryKey: ['products-all'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja desativar este produto?')) return;
    const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id);
    if (error) { toast.error('Erro ao desativar'); return; }
    toast.success('Produto desativado');
    queryClient.invalidateQueries({ queryKey: ['products-all'] });
  };

  const getCategoryName = (id: string | null) => categories.find(c => c.id === id)?.name || '—';
  const formatPrice = (p: number) => Number(p).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg text-foreground">Produtos</h2>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium">
          <Plus className="w-4 h-4" /> Novo produto
        </button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..."
            className="w-full pl-8 p-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="p-2 rounded-lg border border-border bg-background text-sm text-foreground">
          <option value="">Todas categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className={`bg-card rounded-lg border border-border p-3 flex items-center gap-3 ${!p.is_active ? 'opacity-50' : ''}`}>
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
              {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground">{getCategoryName(p.category_id)} • {p.is_pizza ? '🍕 Pizza' : '📦 Produto'}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-foreground">{formatPrice(p.price)}</p>
              {p.promo_price && <p className="text-xs text-success">{formatPrice(p.promo_price)}</p>}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-secondary"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
              <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-destructive" /></button>
            </div>
          </div>
        ))}
        {isLoading && <p className="text-center text-muted-foreground py-8">Carregando...</p>}
        {!isLoading && filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum produto encontrado</p>}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card rounded-xl border border-border p-5 w-full max-w-md max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-foreground">{editing ? 'Editar produto' : 'Novo produto'}</h3>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-full hover:bg-secondary"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome *"
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descrição"
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground resize-none h-16 focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Preço *"
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
                  <input type="number" step="0.01" value={form.promo_price} onChange={e => setForm({ ...form, promo_price: e.target.value })} placeholder="Preço promo"
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
                </div>
                <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground">
                  <option value="">Sem categoria</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="URL da imagem"
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={form.prep_time_min} onChange={e => setForm({ ...form, prep_time_min: e.target.value })} placeholder="Tempo preparo (min)"
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
                  <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} placeholder="Ordem"
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input type="checkbox" checked={form.is_pizza} onChange={e => setForm({ ...form, is_pizza: e.target.checked })} className="rounded border-border" />
                    É pizza
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input type="checkbox" checked={form.allow_two_flavors} onChange={e => setForm({ ...form, allow_two_flavors: e.target.checked })} className="rounded border-border" />
                    2 sabores
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded border-border" />
                    Ativo
                  </label>
                </div>
                <button onClick={handleSave}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> {editing ? 'Salvar alterações' : 'Criar produto'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
