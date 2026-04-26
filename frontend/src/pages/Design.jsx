import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Search, Maximize2, X, Sparkles, Info, MessageSquare, ArrowLeft, Phone, Mail, ShoppingBag, CheckCircle2, ChevronRight, Filter, Shirt, Wind, Shield, Cloud, Ruler, Zap, Feather, Waves, Image as ImageIcon } from 'lucide-react';
import img from '../assets/img';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/Context';
const MAIN_CATEGORIES = [
  { id: 'hangerView', label: 'Hanger View', bgStyle: 'tailoring' },
  { id: 'fullConcept', label: 'Full Concept', bgStyle: 'showcase' },
  { id: 'nbaCutouts', label: 'NBA Cutouts', bgStyle: 'arena' },
];
const SUB_CATEGORIES = [
  { id: 'all', label: 'ALL', subLabel: 'All Designs' },
  { id: 'proLeague', label: 'PRO-LEAGUE CUT', subLabel: 'V-Neck | Athletic Fit' },
  { id: 'aeroV', label: 'AERO-V COLLAR', subLabel: 'V-Neck | Modern Fit' },
  { id: 'primeRound', label: 'PRIME-ROUND FIT', subLabel: 'Round Neck | Classic Fit' },
];
const Design = () => {
  const [activeMainCat, setActiveMainCat] = useState('hangerView');
  const [activeSubCat, setActiveSubCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  const handleBack = () => {
    if (isAuthenticated) {
      navigate('/home');
    } else {
      navigate('/');
    }
  };
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    if (isPreviewOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isPreviewOpen]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const processedDesigns = useMemo(() => {
    const apexItems = (img.jerseys.apex || []).map((src, i) => ({
      src,
      type: i % 2 === 0 ? 'aeroV' : 'primeRound',
      typeLabel: i % 2 === 0 ? 'AERO V • Professional Cut' : 'VINTAGE • Classic Fit',
      id: `h-${i}`,
      index: i
    }));

    const vintageItems = (img.jerseys.vintage || []).map((src, i) => ({
      src,
      type: 'vintage',
      typeLabel: 'VINTAGE SERIES • Retro Collection',
      id: `w-${i}`,
      index: i
    }));

    const nbaItems = (img.jerseys.nba || []).map((src, i) => ({
      src,
      type: 'nba',
      typeLabel: 'NBA SERIES • Pro Performance',
      id: `n-${i}`,
      index: i
    }));
    let source = [];
    let seriesName = '';
    let nameFormat = 'num';

    if (activeMainCat === 'hangerView') {
      source = vintageItems;
      seriesName = 'Vintage Series';
      nameFormat = 'alpha';
    } else if (activeMainCat === 'fullConcept') {
      source = apexItems;
      seriesName = 'Apex Series';
      nameFormat = 'num';
    } else if (activeMainCat === 'nbaCutouts') {
      source = nbaItems;
      seriesName = 'NBA';
      nameFormat = 'alpha-num';
    }

    const getAlphaLabel = (index) => {
      let label = '';
      let i = index;
      while (i >= 0) {
        label = String.fromCharCode((i % 26) + 65) + label;
        i = Math.floor(i / 26) - 1;
      }
      return label;
    };

    return source.map((item, i) => {
      let itemName = '';
      if (nameFormat === 'num') itemName = `${seriesName} ${i + 1}`;
      else if (nameFormat === 'alpha') itemName = `${seriesName} ${getAlphaLabel(i)}`;
      else if (nameFormat === 'alpha-num') itemName = `${seriesName} A${i + 1}`;

      return {
        id: item.id,
        src: item.src,
        name: itemName,
        type: item.type,
        typeLabel: item.typeLabel,
        fabric: 'Spandy Fabric – Stretchable, Smooth, and Game-Ready'
      };
    });
  }, [activeMainCat]);

  const filteredDesigns = useMemo(() => {
    return processedDesigns.filter(design => {
      const matchesSub = activeSubCat === 'all' || design.type === activeSubCat;
      const matchesSearch = design.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.typeLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSub && matchesSearch;
    });
  }, [processedDesigns, activeSubCat, searchQuery]);

  return (
    <div className="min-h-screen bg-[#020617] font-inter text-slate-200 pb-24 overflow-x-hidden">
      <nav className={`h-20 flex items-center justify-between px-6 md:px-12  w-full top-0 z-[100] lg:bg-transparent bg-white/5 backdrop-blur-sm  `}>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors cursor-pointer group">
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex items-center gap-12">
          <div className="flex items-center gap-3 cursor-pointer group">
            <span className="font-black text-sm uppercase tracking-tighter italic text-white">JJSTRACK</span>
            <img src={img.jjslogo1} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
        </div>
      </nav>
      <section className="relative h-full md:h-[100vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover scale-105">
            <source src={img.clip} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/80 to-transparent z-10" />
          <div className="absolute inset-0 backdrop-blur-[2px] z-10" />
        </div>
        <div className="max-w-7xl w-full mx-auto px-6 md:px-12 relative z-20 flex flex-col-reverse md:grid md:grid-cols-2 gap-12 items-center py-24 md:py-0">
          <div className="animate-in fade-in slide-in-from-left duration-1000 font-black">
            <h1 className="text-5xl md:text-8xl mb-4 tracking-tighter uppercase italic leading-none">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-800 via-blue-500 to-blue-900">JJS-Track</span> <br />
              <span className="text-white">DESIGN</span>
            </h1>
            <p className="text-white/60 text-lg md:text-xl font-bold italic mb-8 tracking-tight">
              High Quality | Full Sublimation
            </p>
            <p className="text-white/40 max-w-md text-sm leading-relaxed mb-10 font-medium">
              Crafted with premium <span className="text-white font-bold">spandex fabric</span> that is stretchable, smooth, and lightweight for maximum comfort on the court.
            </p>
            <div className="flex flex-wrap gap-8">
              {[
                { label: 'Spandy Fabric', sub: 'Stretchable & Smooth', icon: Shirt },
                { label: 'Breathable', sub: 'Stay Cool', icon: Wind },
                { label: 'Durable Print', sub: 'Fade-Resistant', icon: Shield }
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-blue-500 bg-white/5">
                    <f.icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-white text-[10px] font-black uppercase tracking-widest leading-none mb-1">{f.label}</h4>
                    <p className="text-white/40 text-[9px] font-medium uppercase tracking-wider">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center md:justify-end animate-in fade-in slide-in-from-top md:slide-in-from-right duration-1000 relative">
            <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full scale-75 md:scale-100" />
            <img
              src={img.jerseys.vintage[6]}
              alt="Featured Jersey"
              className="h-[40vh] md:h-[70vh] object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.5)] md:transform md:translate-x-[-80px] z-10 scale-125 md:scale-100"
            />
          </div>
        </div>
      </section>

      {/* whole */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 mt-20 flex flex-col lg:flex-row gap-10">
        <aside className="w-full lg:w-72 shrink-0">
          <div className="sticky top-28 space-y-12">
            <div className="pt-4">
              <div
                className="flex items-center gap-4 mb-14 group cursor-pointer"
                onClick={handleBack}
              >
                <img src={img.jjslogo1} alt="Logo" className="w-14 h-14 object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-3" />
                <div className="flex flex-col">
                  <span className="font-black text-2xl uppercase tracking-tighter italic text-white leading-none">JJSTRACK</span>
                  <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.4em] mt-1">Design Collections</span>
                </div>
              </div>
              {/* Side */}
              <div className="hidden lg:flex flex-col space-y-12">
                <div className="flex flex-col space-y-6">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Wind, label: 'Cool-Fit', sub: 'Breathable', color: 'text-blue-400' },
                      { icon: Maximize2, label: 'Stretch', sub: 'Spandex', color: 'text-purple-400' },
                      { icon: Feather, label: 'Light', sub: 'Ultra-thin', color: 'text-emerald-400' },
                      { icon: Waves, label: 'Dry', sub: 'Wicking', color: 'text-cyan-400' },
                    ].map((tech, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group overflow-hidden">
                        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${tech.color} shrink-0 transition-transform`}>
                          <tech.icon size={20} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[9px] font-black text-white uppercase tracking-wider leading-none mb-1">{tech.label}</span>
                          <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">{tech.sub}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-8 px-6 min-h-[280px] rounded-[2rem] bg-gradient-to-br from-blue-200/20 to-blue-900/10 backdrop-blur-md border border-white/5 text-white relative overflow-hidden group shadow-2xl overflow-hidden">
                  <div className="absolute -right-20 -top-1 w-80 h-80 opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700 pointer-events-none">
                    <img src={img.lbj} alt="lebron" className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
                  </div>
                  <div className="relative z-10 pt-24">
                    <h3 className="text-3xl font-black italic uppercase leading-[0.8] mb-4">BUILT <br />FOR <span className="text-blue-400">ELITE</span> <br />BALLERS</h3>
                    <p className="text-[10px] font-bold text-blue-100/60 uppercase tracking-widest leading-relaxed mb-6">Engineered for peak performance on every court.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden lg:block space-y-3 pb-10">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">Size Charts</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Jersey Guide</span>
                  <div className="group relative aspect-[14/13] bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-blue-500/30 transition-all flex items-center justify-center">
                    <img src={img.sctop1} alt="Jersey Size Chart" className="w-[40vh] h-[40vh] object-contain p-0 mt-5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Shorts Guide</span>
                  <div className="group relative aspect-[14/13] bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-blue-500/30 transition-all flex items-center justify-center">
                    <img src={img.scbot} alt="Shorts Size Chart" className="w-[40vh] h-[40vh] object-contain p-0 mt-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-8 rounded-[1rem] bg-transparent border border-white/10 text-white relative overflow-hidden group shadow-2xl shadow-blue-500/20">
            <div className="relative z-10">
              <h3 className="text-2xl font-black italic uppercase italic leading-none mb-4">WANT YOUR <br /> OWN <span className="text-blue-200">DESIGN?</span></h3>
              <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest leading-relaxed mb-6">Join with us to create your own custom design.</p>
              <button
                onClick={() => navigate('/signup')}
                className="w-full py-4 bg-white text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl"
              >
                Contact Us
              </button>
            </div>
            <div className="absolute -right-4 bottom-6 opacity-60 transition-transform duration-700">
              <img src={img.jjslogo1} alt="jjs logo" className="h-40" />
            </div>
          </div>
        </aside>
        <div className="flex-1">
          <div className="flex flex-col xl:flex-row items-center justify-between gap-6 mb-12 sticky top-28 z-40 bg-[#020617]/80 backdrop-blur-md py-4 -mx-4 px-4 rounded-3xl xl:bg-transparent xl:backdrop-blur-none xl:py-0 xl:mx-0 xl:px-0">
            <div className="relative w-full xl:w-96 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search designs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl pl-16 pr-6 py-4 text-sm font-semibold text-white focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 transition-all outline-none"
              />
            </div>

            <div className="flex items-center gap-1 p-1.5 bg-white/5 rounded-2xl overflow-x-auto no-scrollbar w-full xl:w-auto">
              {MAIN_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveMainCat(cat.id);
                    setActiveSubCat('all');
                  }}
                  className={`px-4 lg:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeMainCat === cat.id ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <main className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredDesigns.map((design) => (
              <div
                key={design.id}
                onClick={() => {
                  setSelectedDesign(design);
                  setIsPreviewOpen(true);
                }}
                className="group relative bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-white/10 transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] hover:bg-white/[0.08] hover:border-white/20 cursor-pointer"
              >
                <div className="aspect-[5/4] relative overflow-hidden flex items-center justify-center p-12">
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <img src={design.src} alt={design.name} className="max-w-full max-h-[90vh] object-cover relative transition-all duration-500 drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)]" />
                  <div className="absolute inset-0 z-999 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-100">
                    <div className="bg-white/10 backdrop-blur-md text-white w-14 h-14 rounded-full flex items-center justify-center border border-white/20 transform scale-50 group-hover:scale-100 transition-all duration-500 z-999">
                      <Maximize2 size={22} />
                    </div>
                  </div>
                </div>
                <div className="p-8 text-left border-t border-white/5">
                  <p className="text-blue-500 font-black text-[9px] uppercase tracking-[0.2em] mb-2">{design.typeLabel}</p>
                  <h3 className="font-black text-white text-lg uppercase tracking-widest leading-none group-hover:text-blue-400 transition-colors">{design.name}</h3>
                </div>
              </div>
            ))}
          </main>

          {filteredDesigns.length === 0 && (
            <div className="py-32 text-center bg-white/5 backdrop-blur-md border border-white/5 rounded-[3rem] mt-12">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="text-white/20" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No designs match your search</h3>
              <p className="text-white/40 max-w-xs mx-auto text-sm font-medium">Try checking a different category or refining your search terms.</p>
            </div>
          )}
        </div>
      </div>
      {isPreviewOpen && selectedDesign && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-700"
            onClick={() => setIsPreviewOpen(false)}
          />
          <div className="relative w-[95%] max-w-7xl h-[85vh] md:h-[85vh] rounded-[1.5rem] shadow-[0_0_80px_-20px_rgba(59,130,246,0.3)] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 fade-in duration-700 border border-white/10 bg-[#020617]/50">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-6 right-6 z-[100] w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 backdrop-blur-md group"
            >
              <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

            <div className="absolute top-0 left-0 w-full p-8 flex items-center justify-between z-50 pointer-events-none">
              <div className="flex items-center gap-4 mr-16">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest hidden sm:block">Design ID: {selectedDesign.id}</span>
              </div>
            </div>
            <div className="w-full md:w-1/2 relative h-[45%] md:h-full flex items-center justify-center p-6 md:p-12 bg-[#f8fafc] overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] bg-[size:30px_30px]" />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-transparent to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 bg-blue-500/10 blur-[100px] rounded-full" />

              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <img
                  src={selectedDesign.src}
                  alt={selectedDesign.name}
                  className="max-w-full h-full object-contain drop-shadow-[0_60px_100px_rgba(0,0,0,0.15)] scale-110 md:scale-100 hover:scale-105 transition-transform duration-700"
                />
              </div>

              <div className="absolute bottom-12 left-12 hidden md:block">
                <h4 className="text-7xl font-black italic text-slate-900/10 uppercase tracking-tighter leading-none mb-2 select-none">AUTHENTIC</h4>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900/5 flex items-center justify-center">
                    <img src={img.jjslogo1} alt="Logo" className="w-5 h-5 object-contain opacity-40 grayscale" />
                  </div>
                  <span className="text-[10px] font-black text-slate-900/30 uppercase tracking-[0.4em]">JJS-DESIGN • PREMIUM</span>
                </div>
              </div>
            </div>
            <div className="flex-[55%] md:flex-1 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-2xl p-6 md:p-16 flex flex-col h-full md:border-l border-white/10 overflow-y-auto no-scrollbar scroll-smooth">
              <div className="max-w-xl mx-auto w-full pt-16 pb-12 md:pt-12">
                <header className="mb-12">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center gap-2">
                      <span className="px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                        {selectedDesign.typeLabel.split('•')[0].trim()}
                      </span>
                    </div>
                    <div className="h-px w-12 bg-white/10" />
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Elite Collection</span>
                  </div>

                  <h2 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter italic leading-[0.8] mb-10 group">
                    {selectedDesign.name.split(' ').map((word, i) => (
                      <span key={i} className={i === 1 ? "text-blue-500" : "text-white"}>
                        {word}{' '}
                        {i === 0 && <br />}
                      </span>
                    ))}
                  </h2>

                  <div className="flex items-center gap-4 mb-8">
                    <p className="text-[11px] md:text-sm font-bold text-white/60 uppercase tracking-[0.2em] leading-relaxed max-w-sm">
                      {selectedDesign.fabric}
                    </p>
                  </div>
                </header>

                <div className="space-y-16">
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                        Quality Specifications
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'HD Sublimation Print', icon: Zap, color: 'text-yellow-400' },
                        { label: 'Premium Spandex Fabric', icon: Shirt, color: 'text-blue-400' },
                        { label: 'Aero-Dry Cool', icon: Wind, color: 'text-cyan-400' },
                        { label: 'NBA Professional Cut', icon: Maximize2, color: 'text-purple-400' },
                        { label: 'Direct to Garment', icon: Shield, color: 'text-emerald-400' },
                        { label: 'Precision Fit', icon: Ruler, color: 'text-rose-400' }
                      ].map((spec, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.08] transition-all group">
                          <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${spec.color} shrink-0 group-hover:scale-110 transition-all`}>
                            <spec.icon size={18} />
                          </div>
                          <span className="text-[10px] font-black text-white/80 uppercase tracking-widest leading-tight">{spec.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-10 pt-12 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                        Direct Inquiries
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { icon: MessageSquare, label: 'Messenger', value: 'jjsportswearph', link: 'https://www.facebook.com/JennoelJennyl', color: 'bg-blue-500/10 text-blue-400' },
                        { icon: Phone, label: 'Call Us', value: '0908 997 2332', link: 'tel:0908 997 2332', color: 'bg-emerald-500/10 text-emerald-400' },
                        { icon: Mail, label: 'Email', value: 'jjsportswearph@gmail.com', link: 'mailto:jjsportswearph@gmail.com', color: 'bg-amber-500/10 text-amber-400' }
                      ].map((contact, i) => (
                        <a
                          key={i}
                          href={contact.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all group items-center text-center"
                        >
                          <div className={`w-12 h-12 rounded-full ${contact.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <contact.icon size={20} />
                          </div>
                          <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">{contact.label}</span>
                          <span className="text-[10px] font-black text-white uppercase tracking-widest truncate w-full group-hover:text-white transition-colors">{contact.value}</span>
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="pb-12 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4 opacity-20 grayscale">
                      <img src={img.jjslogo1} alt="Logo" className="w-6 h-6 object-contain" />
                      <div className="w-1 h-1 rounded-full bg-white" />
                      <span className="text-[8px] font-black text-white uppercase tracking-[0.4em]">JJS TRACK</span>
                    </div>
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.4em] leading-relaxed">
                      CRAFTING EXCELLENCE • EST. 2026
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Design;
