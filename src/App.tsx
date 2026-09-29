import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Download,
  Copy,
  Trash2,
  ExternalLink,
  CheckCircle2,
  MapPin,
  RefreshCw,
  X,
  Code2,
  Terminal,
  Sparkles,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { INITIAL_DATA, STORAGE_KEY, PortfolioConfig, PortfolioLink } from './data/portfolioData';
import { ProjectIcon } from './components/ProjectIcon';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function App() {
  // Load initial configuration from localStorage or default
  const [config, setConfig] = useState<PortfolioConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.links) && parsed.links.length > 0) {
          // Filter out any placeholders if they exist
          parsed.links = parsed.links.filter(
            (l: PortfolioLink) =>
              !l.url?.includes('example.com') &&
              !l.title?.toLowerCase().includes('exemplo')
          );
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar do cache:', e);
    }
    return INITIAL_DATA;
  });

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeTopic, setActiveTopic] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [deleteCandidate, setDeleteCandidate] = useState<PortfolioLink | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  // New Link Form State
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('1-trimestre');
  const [newTopic, setNewTopic] = useState<'html' | 'js' | 'google-ai'>('html');

  // Toast notifications
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  const saveConfig = (newConfig: PortfolioConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
  };

  const handleLinkClick = (linkId: string) => {
    const updatedLinks = config.links.map(l => {
      if (l.id === linkId) {
        return { ...l, clicks: (l.clicks || 0) + 1 };
      }
      return l;
    });
    saveConfig({ ...config, links: updatedLinks });
  };

  const handleCopyLink = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => showToast('Link copiado para a área de transferência!'))
        .catch(() => showToast('Link: ' + url));
    } else {
      showToast('Link: ' + url);
    }
  };

  const handleDeleteLink = () => {
    if (!deleteCandidate) return;
    const updatedLinks = config.links.filter(l => l.id !== deleteCandidate.id);
    saveConfig({ ...config, links: updatedLinks });
    setDeleteCandidate(null);
    showToast('Projeto removido!');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    let url = newUrl.trim();
    const desc = newDesc.trim();

    if (!title || !url) return;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const newLink: PortfolioLink = {
      id: 'custom-' + Date.now(),
      title,
      url,
      description: desc,
      categoryId: newCategory,
      topic: newTopic,
      badge: newTopic === 'google-ai' ? 'Google AI' : newTopic.toUpperCase(),
      icon: newTopic === 'html' ? 'Code2' : newTopic === 'google-ai' ? 'Sparkles' : 'Terminal',
      clicks: 0
    };

    const updatedLinks = [newLink, ...config.links];
    saveConfig({ ...config, links: updatedLinks });
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewUrl('');
    setNewDesc('');
    showToast('Projeto cadastrado com sucesso!');
  };

  const handleResetToDefault = () => {
    saveConfig(INITIAL_DATA);
    setIsResetConfirmOpen(false);
    setIsExportModalOpen(false);
    showToast('Dados restaurados para o padrão original!');
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2))
      .then(() => showToast('JSON copiado para a área de transferência!'))
      .catch(() => showToast('Erro ao copiar JSON'));
  };

  // Filtered links
  const filteredLinks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return config.links.filter(link => {
      const matchCat = activeCategory === 'all' || link.categoryId === activeCategory;
      const matchTopic = activeTopic === 'all' || (link.topic || 'html') === activeTopic;
      const matchSearch = !q ||
        (link.title && link.title.toLowerCase().includes(q)) ||
        (link.description && link.description.toLowerCase().includes(q)) ||
        (link.url && link.url.toLowerCase().includes(q)) ||
        (link.badge && link.badge.toLowerCase().includes(q));
      return matchCat && matchTopic && matchSearch;
    });
  }, [config.links, activeCategory, activeTopic, searchQuery]);

  const countQ1 = useMemo(() => config.links.filter(l => l.categoryId === '1-trimestre').length, [config.links]);
  const countQ2 = useMemo(() => config.links.filter(l => l.categoryId === '2-trimestre').length, [config.links]);
  const countQ3 = useMemo(() => config.links.filter(l => l.categoryId === '3-trimestre').length, [config.links]);

  const getCategoryLabel = (catId: string) => {
    if (catId === '1-trimestre') return '1º Trimestre';
    if (catId === '2-trimestre') return '2º Trimestre';
    if (catId === '3-trimestre') return '3º Trimestre';
    return catId;
  };

  const renderTopicBadge = (topic: string) => {
    if (topic === 'html') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/15 border border-orange-500/30 text-orange-400">
          <Code2 className="w-3.5 h-3.5" /> HTML
        </span>
      );
    }
    if (topic === 'google-ai') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" /> Google AI
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
        <Terminal className="w-3.5 h-3.5" /> JavaScript
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#0c0d12] text-neutral-100 flex flex-col font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-[#0c0d12]/90 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              {config.profile.name.charAt(0) || 'K'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white">{config.profile.name}</span>
                <span title="Verificada" className="text-indigo-400">
                  <CheckCircle2 className="w-4 h-4 fill-indigo-500/20" />
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-medium hidden sm:block">Portfólio de Links • Colégio Unidade Polo</p>
            </div>
          </div>

          {/* Search Bar & Actions */}
          <div className="flex items-center gap-2.5 flex-1 max-w-md justify-end">
            <div className="relative w-full max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar projetos..."
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-neutral-900 border border-neutral-700/80 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-neutral-400 hover:text-white text-xs transition"
                  title="Limpar pesquisa"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Botão Adicionar Site */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title="Cadastrar novo projeto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Adicionar</span>
            </button>

            {/* Botão Backup / Código */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="shrink-0 p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/60 text-neutral-300 hover:text-white transition cursor-pointer"
              title="Configuração / Backup"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8">

        {/* CARTÃO DE PERFIL */}
        <section className="p-6 sm:p-8 rounded-3xl bg-neutral-900/50 border border-neutral-800/80 relative overflow-hidden backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            
            {/* Avatar */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-xl shadow-indigo-500/10 shrink-0">
              <div className="w-full h-full rounded-2xl bg-neutral-900 flex items-center justify-center font-extrabold text-2xl sm:text-3xl text-indigo-400">
                {config.profile.name.charAt(0) || 'K'}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-neutral-900 border-2 border-neutral-800" title="Disponível">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
            </div>

            {/* Bio & Dados */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{config.profile.name}</h1>
                <span className="text-indigo-400" title="Perfil verificado">
                  <CheckCircle2 className="w-5 h-5 fill-indigo-500/20" />
                </span>
              </div>

              <p className="text-sm sm:text-base font-semibold text-indigo-400 mb-2.5">
                {config.profile.role}
              </p>

              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-2xl mb-4">
                {config.profile.bio}
              </p>

              {/* Pills de Informação Rápida */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {config.profile.location && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-800/80 text-neutral-300 border border-neutral-700/60">
                    <MapPin className="w-3.5 h-3.5 opacity-70 text-indigo-400" /> {config.profile.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {config.profile.statusText || 'Disponível'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  {config.links.length} Projetos Ativos
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* NAVEGAÇÃO POR TRIMESTRES E MATÉRIAS */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-neutral-800">
            
            {/* Abas dos Trimestres */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-neutral-900/60 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <span>Todos os Projetos</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/30">{config.links.length}</span>
              </button>

              <button
                onClick={() => setActiveCategory('1-trimestre')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeCategory === '1-trimestre'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-neutral-900/60 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <span>1º Trimestre</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/30">{countQ1}</span>
              </button>

              <button
                onClick={() => setActiveCategory('2-trimestre')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeCategory === '2-trimestre'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-neutral-900/60 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <span>2º Trimestre</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/30">{countQ2}</span>
              </button>

              <button
                onClick={() => setActiveCategory('3-trimestre')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeCategory === '3-trimestre'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-neutral-900/60 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <span>3º Trimestre</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/30">{countQ3}</span>
              </button>
            </div>

            {/* Filtro por Matéria */}
            <div className="flex items-center gap-1.5 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800 text-xs">
              <button
                onClick={() => setActiveTopic('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  activeTopic === 'all' ? 'bg-neutral-750 text-white font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setActiveTopic('html')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  activeTopic === 'html' ? 'bg-orange-500/20 text-orange-300 font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                HTML
              </button>
              <button
                onClick={() => setActiveTopic('js')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  activeTopic === 'js' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                JS
              </button>
              <button
                onClick={() => setActiveTopic('google-ai')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  activeTopic === 'google-ai' ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Google AI
              </button>
            </div>

          </div>

          {/* Indicador de resultados da pesquisa */}
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <div>
              Mostrando <strong className="text-white font-bold">{filteredLinks.length}</strong> de {config.links.length} projetos
              {searchQuery && (
                <span className="ml-1 text-indigo-400 font-medium">
                  (pesquisando por &ldquo;{searchQuery}&rdquo;)
                </span>
              )}
            </div>
          </div>
        </section>

        {/* GRID DE PROJETOS */}
        <section>
          {filteredLinks.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl bg-neutral-900/30 border border-neutral-800/60">
              <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400 mb-3">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Nenhum projeto encontrado</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-4">
                Tente buscar por outro termo ou mudar os filtros de trimestre e matéria.
              </p>
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setActiveTopic('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition cursor-pointer"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLinks.map((link) => (
                <div
                  key={link.id}
                  className="group relative rounded-2xl p-5 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700/80 transition-all duration-200 flex flex-col justify-between gap-4"
                >
                  {/* Topo do Card */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      {renderTopicBadge(link.topic || 'html')}
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                        <span className="px-2 py-0.5 rounded bg-neutral-800/80 border border-neutral-700/50 flex items-center gap-1">
                          <Calendar className="w-3 h-3 opacity-60" />
                          {getCategoryLabel(link.categoryId)}
                        </span>
                        {link.clicks ? (
                          <span className="text-neutral-500" title={`${link.clicks} acessos`}>
                            • {link.clicks} {link.clicks === 1 ? 'clique' : 'cliques'}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 mb-1.5">
                      <div className="p-2 rounded-xl bg-neutral-800/80 text-neutral-300 group-hover:text-indigo-400 group-hover:bg-neutral-800 transition">
                        <ProjectIcon name={link.icon} topic={link.topic} className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug pt-0.5">
                        {link.title}
                      </h3>
                    </div>

                    {link.description && (
                      <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2 mt-1">
                        {link.description}
                      </p>
                    )}
                  </div>

                  {/* Rodapé do Card com Ações */}
                  <div className="pt-3 border-t border-neutral-800/60 flex items-center justify-between gap-2">
                    {/* Link Principal */}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleLinkClick(link.id)}
                      className="project-link flex-1 min-w-0 px-3 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 text-xs font-semibold flex items-center justify-between gap-2 transition"
                    >
                      <span className="truncate">Acessar Projeto</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>

                    {/* Botão Copiar Link */}
                    <button
                      onClick={(e) => handleCopyLink(link.url, e)}
                      className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
                      title="Copiar link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Botão Excluir */}
                    <button
                      onClick={() => setDeleteCandidate(link)}
                      className="p-2 rounded-xl bg-neutral-800/80 hover:bg-red-500/20 text-neutral-500 hover:text-red-400 transition cursor-pointer"
                      title="Remover projeto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-neutral-800/80 py-8 px-4 text-center text-xs text-neutral-500 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {config.profile.name} • Portfólio Escolar 100% Autônomo</p>
          <div className="flex items-center gap-4 text-neutral-400">
            <span>HTML5</span>
            <span>•</span>
            <span>JavaScript</span>
            <span>•</span>
            <span>Google AI</span>
          </div>
        </div>
      </footer>

      {/* MODAL: ADICIONAR PROJETO */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" /> Adicionar Projeto
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-white text-sm p-1 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1 font-semibold">Trimestre</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-neutral-800 text-neutral-200 text-xs rounded-xl px-3 py-2.5 border border-neutral-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="1-trimestre">1º Trimestre</option>
                    <option value="2-trimestre">2º Trimestre</option>
                    <option value="3-trimestre">3º Trimestre</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1 font-semibold">Matéria / Módulo</label>
                  <select
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value as any)}
                    className="w-full bg-neutral-800 text-neutral-200 text-xs rounded-xl px-3 py-2.5 border border-neutral-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="html">HTML</option>
                    <option value="js">JavaScript (JS)</option>
                    <option value="google-ai">Google AI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1 font-semibold">Nome do Projeto</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Meu Jogo HTML"
                  required
                  className="w-full bg-neutral-800 text-neutral-200 text-xs rounded-xl px-3 py-2.5 border border-neutral-700 focus:outline-none focus:border-indigo-500 placeholder-neutral-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1 font-semibold">URL / Link</label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  required
                  className="w-full bg-neutral-800 text-neutral-200 text-xs rounded-xl px-3 py-2.5 border border-neutral-700 focus:outline-none focus:border-indigo-500 placeholder-neutral-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1 font-semibold">Descrição (opcional)</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Breve resumo do projeto..."
                  className="w-full bg-neutral-800 text-neutral-200 text-xs rounded-xl px-3 py-2.5 border border-neutral-700 focus:outline-none focus:border-indigo-500 placeholder-neutral-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
                >
                  Salvar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXPORTAR / BACKUP */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-400" /> Backup & Código
              </h3>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-neutral-400 hover:text-white text-sm p-1 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Este portfólio roda 100% autônomo. Você pode copiar o JSON com os dados salvos ou restaurar os projetos padrão se desejar.
            </p>

            <div className="relative">
              <textarea
                readOnly
                rows={8}
                value={JSON.stringify(config, null, 2)}
                className="w-full font-mono text-[11px] p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-neutral-300 focus:outline-none resize-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setIsResetConfirmOpen(true)}
                className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Restaurar Padrão
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyJSON}
                  className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar JSON
                </button>
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO DE RESTAURAÇÃO */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-700 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Restaurar Projetos Padrão?</h4>
                <p className="text-xs text-neutral-400 mt-0.5">Todos os 31 links originais serão restaurados.</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetToDefault}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition cursor-pointer shadow-md"
              >
                Sim, Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-700 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white">Remover Projeto?</h4>
                <p className="text-xs text-neutral-400 mt-0.5 truncate">
                  Deseja remover &ldquo;{deleteCandidate.title}&rdquo; do portfólio?
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteLink}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition cursor-pointer shadow-md"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="px-4 py-3 rounded-2xl bg-neutral-900/95 border border-neutral-700/80 text-white shadow-2xl text-xs flex items-center gap-2.5 backdrop-blur-md transition-all duration-300 pointer-events-auto"
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
