import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Phone, ArrowUpRight, ArrowDownLeft, Search, RefreshCw, Settings, Eye, EyeOff, Save } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface WhatsAppMessage {
  id: string;
  phone: string;
  direction: string;
  message: string;
  message_type: string;
  wa_message_id: string | null;
  created_at: string;
}

export function WhatsAppPanel() {
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'conversations' | 'config'>('conversations');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-success" /> WhatsApp Bot
        </h2>
        <div className="flex gap-1">
          <button onClick={() => setTab('conversations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === 'conversations' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
            <MessageSquare className="w-3.5 h-3.5 inline mr-1" />Conversas
          </button>
          <button onClick={() => setTab('config')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === 'config' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
            <Settings className="w-3.5 h-3.5 inline mr-1" />Configuração
          </button>
        </div>
      </div>

      {tab === 'conversations' ? (
        <ConversationsTab selectedPhone={selectedPhone} setSelectedPhone={setSelectedPhone} search={search} setSearch={setSearch} />
      ) : (
        <ConfigTab />
      )}
    </div>
  );
}

function ConfigTab() {
  const queryClient = useQueryClient();
  const [showToken, setShowToken] = useState(false);
  const [form, setForm] = useState({ access_token: '', phone_number_id: '', verify_token: '' });

  const { data: config, isLoading } = useQuery({
    queryKey: ['whatsapp-config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('whatsapp_config').select('*').limit(1).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (config) {
      setForm({
        access_token: config.access_token || '',
        phone_number_id: config.phone_number_id || '',
        verify_token: config.verify_token || '',
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!config?.id) throw new Error('Config not found');
      const { error } = await supabase.from('whatsapp_config').update({
        access_token: form.access_token,
        phone_number_id: form.phone_number_id,
        verify_token: form.verify_token,
        updated_at: new Date().toISOString(),
      }).eq('id', config.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
      toast.success('Configuração salva com sucesso!');
    },
    onError: () => toast.error('Erro ao salvar configuração'),
  });

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`;

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4 max-w-xl">
      {/* Webhook URL */}
      <div className="bg-secondary/50 rounded-lg p-4 space-y-1">
        <p className="text-xs font-medium text-foreground">URL do Webhook (cole no Meta):</p>
        <div className="flex items-center gap-2">
          <code className="text-xs bg-background px-2 py-1 rounded border border-border flex-1 overflow-x-auto text-foreground">
            {webhookUrl}
          </code>
          <button onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success('URL copiada!'); }}
            className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs">
            Copiar
          </button>
        </div>
      </div>

      {/* Config form */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        <h3 className="font-medium text-sm text-foreground">Credenciais da API WhatsApp</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Access Token</label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={form.access_token}
                onChange={e => setForm(f => ({ ...f, access_token: e.target.value }))}
                placeholder="EAAxxxxxx..."
                className="w-full pr-10 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary"
              />
              <button type="button" onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground">
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone Number ID</label>
            <input
              type="text"
              value={form.phone_number_id}
              onChange={e => setForm(f => ({ ...f, phone_number_id: e.target.value }))}
              placeholder="1234567890..."
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Verify Token</label>
            <input
              type="text"
              value={form.verify_token}
              onChange={e => setForm(f => ({ ...f, verify_token: e.target.value }))}
              placeholder="meu_token_secreto"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Obtenha essas credenciais no <a href="https://developers.facebook.com" target="_blank" rel="noopener" className="text-primary underline">Meta Developers</a> → WhatsApp → API Setup.
      </p>
    </div>
  );
}

function ConversationsTab({ selectedPhone, setSelectedPhone, search, setSearch }: {
  selectedPhone: string | null;
  setSelectedPhone: (p: string | null) => void;
  search: string;
  setSearch: (s: string) => void;
}) {

  // Fetch unique conversations
  const { data: conversations = [], refetch } = useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('whatsapp_messages')
        .select('phone, created_at, message, direction')
        .order('created_at', { ascending: false });

      if (!data) return [];

      // Group by phone, get last message
      const map = new Map<string, { phone: string; lastMessage: string; lastAt: string; direction: string; count: number }>();
      for (const m of data) {
        if (!map.has(m.phone)) {
          map.set(m.phone, { phone: m.phone, lastMessage: m.message, lastAt: m.created_at, direction: m.direction, count: 1 });
        } else {
          map.get(m.phone)!.count++;
        }
      }
      return Array.from(map.values());
    },
    refetchInterval: 10000,
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery({
    queryKey: ['whatsapp-messages', selectedPhone],
    queryFn: async () => {
      if (!selectedPhone) return [];
      const { data } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('phone', selectedPhone)
        .order('created_at', { ascending: true });
      return (data || []) as WhatsAppMessage[];
    },
    enabled: !!selectedPhone,
    refetchInterval: 5000,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' }, () => {
        refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const filtered = conversations.filter(c =>
    c.phone.includes(search) || c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => refetch()} className="p-2 rounded-lg hover:bg-secondary">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px]">
        {/* Conversation list */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                Nenhuma conversa ainda.
                <br />Configure o webhook no Meta para começar.
              </p>
            )}
            {filtered.map(c => (
              <button
                key={c.phone}
                onClick={() => setSelectedPhone(c.phone)}
                className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors ${selectedPhone === c.phone ? 'bg-secondary' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-success flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">+{c.phone}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(c.lastAt), 'HH:mm')}
                    </p>
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded-full">
                      {c.count}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat view */}
        <div className="md:col-span-2 bg-card rounded-xl border border-border flex flex-col overflow-hidden">
          {!selectedPhone ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Selecione uma conversa
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-border bg-secondary/30">
                <p className="font-medium text-sm text-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4 text-success" /> +{selectedPhone}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[450px]">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                      m.direction === 'outgoing'
                        ? 'bg-success/15 text-foreground rounded-br-sm'
                        : 'bg-secondary text-foreground rounded-bl-sm'
                    }`}>
                      <div className="flex items-center gap-1 mb-0.5">
                        {m.direction === 'incoming'
                          ? <ArrowDownLeft className="w-3 h-3 text-primary" />
                          : <ArrowUpRight className="w-3 h-3 text-success" />
                        }
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(m.created_at), 'HH:mm')}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap break-words">{m.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
