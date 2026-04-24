import React, { useState, useEffect, useMemo } from 'react';
import { Search, Maximize2, X, Sparkles, Info, MessageSquare, ArrowLeft, Phone, Mail, ShoppingBag, CheckCircle2, ChevronRight, Filter, Shirt, Wind, Shield } from 'lucide-react';
import img from '../assets/img';
import { useNavigate } from 'react-router-dom';

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
      type: 'apex',
      typeLabel: 'APEX SERIES • Pro Showcase',
      id: `w-${i}`,
      index: i
    }));

    const nbaItems = (img.jerseys.nba || []).map((src, i) => ({
      src,
      type: 'apex',
      typeLabel: 'APEX SERIES • NBA Cutout',
      id: `n-${i}`,
      index: i
    }));

    let source = [];
    let seriesName = '';
    let nameFormat = 'num'; // 'num', 'alpha', 'alpha-num'

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
      {/* --- NAVBAR --- */}
      <nav className={`h-20 flex items-center justify-between px-6 md:px-12  w-full top-0 z-[100] bg-transparent backdrop-blur-sm  `}>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="flex items-center gap-12">
          <div className="flex items-center gap-3 cursor-pointer group">
            <span className="font-black text-sm uppercase tracking-tighter italic text-white">JJSTRACK</span>
            <img src={img.jjslogo1} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative h-full md:h-[100vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover scale-105">
            <source src={img.clip} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/80 to-transparent z-10" />
          <div className="absolute inset-0 backdrop-blur-[2px] z-10" />
        </div>

        <div className="max-w-7xl w-full mx-auto px-6 md:px-12 relative z-20 grid md:grid-cols-2 gap-12 items-center">
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
          <div className="hidden md:flex  justify-end animate-in fade-in slide-in-from-right duration-1000">
            <img src={img.jerseys.vintage[4]} alt="Featured Jersey" className="h-[70vh] object-contain drop-shadow-[0_20px_50px_rgba(37,99,235,0.2)] transform translate-x-[-80px]" />
          </div>
        </div>
      </section>

      {/* --- CONTENT SECTION --- */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 mt-20 flex flex-col lg:flex-row gap-12">
        {/* Sidebar Categories */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="sticky top-28 space-y-12">
            <div className="pt-4">
              <div
                className="flex items-center gap-4 mb-14 group cursor-pointer"
                onClick={() => navigate('/')}
              >
                <img src={img.jjslogo1} alt="Logo" className="w-14 h-14 object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-3" />
                <div className="flex flex-col">
                  <span className="font-black text-2xl uppercase tracking-tighter italic text-white leading-none">JJSTRACK</span>
                  <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.4em] mt-1">Design Collections</span>
                </div>
              </div>

              <div className="space-y-3 mt-10">
                <div className="space-y-2">
                  {SUB_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveSubCat(cat.id)}
                      className={`w-full text-left p-4 rounded-xl transition-all group flex items-center justify-between border ${activeSubCat === cat.id ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-900/10' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">
                          {cat.id === 'all' ? cat.label : (
                            activeMainCat === 'fullConcept' ? 'APEX SERIES' : (
                              activeMainCat === 'hangerView' ? 'VINTAGE SERIES' : 'NBA'
                            )
                          )}
                        </h4>
                        <p className={`text-[9px] font-bold uppercase tracking-wider ${activeSubCat === cat.id ? 'text-blue-100' : 'text-slate-500'}`}>{cat.subLabel}</p>
                      </div>
                      {activeSubCat === cat.id && <ChevronRight size={14} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>


            <div>
              <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] mb-6">Material</h3>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Spandy Fabric</p>
                <ul className="space-y-3">
                  {['Stretchable', 'Smooth & Soft', 'Lightweight', 'Moisture-Wicking'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <CheckCircle2 size={12} className="text-blue-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="p-12 px-6 h-full w-70 rounded-[1rem] bg-blue-600/10 backdrop-blur-md border border-white/10 text-white relative overflow-hidden group shadow-2xl shadow-blue-900/40">
              <div className="absolute -right-20 -top-1 w-72 h-72 opacity-60 group-hover:opacity-70 group-hover:scale-110 transition-all duration-500 pointer-events-none">
                <img src={img.lbj} alt="lebron" className="w-full h-full object-contain  drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)]" />
              </div>
              <h3 className="text-2xl font-black italic uppercase leading-[0.8] mb-4 relative z-10">BUILT <br />FOR <span className="text-blue-400">ELITE</span> <br />BALLERS</h3>
              <p className="text-[10px] font-semibold text-stone-100 uppercase tracking-widest leading-relaxed mb-4 relative z-10">Designed to elevate your game. Made to match your ambition.</p>
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

            <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl overflow-x-auto no-scrollbar w-full xl:w-auto">
              {MAIN_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveMainCat(cat.id);
                    setActiveSubCat('all');
                  }}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeMainCat === cat.id ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
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
                  <img src={design.src} alt={design.name} className="max-w-full max-h-[130vh] object-cover relative transition-all duration-500 drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)]" />
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

      {/* --- PREVIEW MODAL --- */}
      {isPreviewOpen && selectedDesign && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-10 bg-[#020617]/98 backdrop-blur-3xl overflow-hidden">
          <div className="relative w-full max-w-7xl h-full md:h-[90vh] bg-[#020617] md:rounded-[4rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 fade-in duration-500 border border-white/10">
            {/* Close Button & Action Bar */}
            <div className="absolute top-0 left-0 w-full p-8 flex items-center justify-between z-50 bg-gradient-to-b from-[#020617] to-transparent">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-md border border-white/10 group cursor-pointer"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Back to Designs
              </button>

              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest hidden sm:block">Design ID: {selectedDesign.id}</span>
                <button onClick={() => navigate('/signup')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20">Order Custom</button>
              </div>
            </div>

            {/* Left Side: Sticky Visuals */}
            <div className="w-full md:w-1/2 relative h-[50vh] md:h-full flex items-center justify-center p-12 bg-[#020617] overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff22_1px,transparent_1px)] bg-[size:40px_40px]" />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent" />
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <img
                  src={selectedDesign.src}
                  alt={selectedDesign.name}
                  className="max-w-full h-full object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.5)] scale-90 md:scale-100"
                />
              </div>
              <div className="absolute bottom-12 left-12 hidden md:block">
                <h4 className="text-6xl font-black italic text-white/5 uppercase tracking-tighter leading-none mb-2">AUTHENTIC</h4>
                <div className="flex items-center gap-3">
                  <img src={img.jjslogo1} alt="Logo" className="w-8 h-8 object-contain opacity-20" />
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">JJSTRACK APPAREL</span>
                </div>
              </div>
            </div>

            {/* Right Side: Scrollable Details */}
            <div className="flex-1 bg-white/[0.02] backdrop-blur-sm p-8 md:p-16 flex flex-col h-full border-l border-white/5 overflow-y-auto no-scrollbar scroll-smooth">
              <div className="max-w-xl mx-auto w-full py-20 md:py-0">
                <header className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-4 py-2 rounded-xl bg-blue-600 text-[10px] font-black text-white uppercase tracking-widest shadow-xl shadow-blue-600/20">
                      {selectedDesign.typeLabel.split('•')[0].trim()}
                    </span>
                    <div className="h-px w-12 bg-white/10" />
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Elite Collection</span>
                  </div>
                  <h2 className="text-6xl md:text-7xl font-black text-white uppercase tracking-tighter italic leading-[0.8] mb-8">{selectedDesign.name}</h2>
                  <p className="text-sm font-bold text-blue-400 uppercase tracking-[0.2em] leading-relaxed max-w-sm">{selectedDesign.fabric}</p>
                </header>

                <div className="space-y-16">
                  {/* Specs List */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500">
                        <Sparkles size={18} />
                      </div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Quality Specifications</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {[
                        'High-Definition Sublimation Print',
                        'Premium Prime-Spandex Fabric',
                        'Moisture-Wicking & Breathable',
                        'Lightweight Game-Ready Texture',
                        'Durable Athletic Construction'
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-5 p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.05] transition-all group">
                          <CheckCircle2 size={18} className="text-blue-500 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold text-white/70 uppercase tracking-widest">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contact List */}
                  <div className="space-y-8 pt-12 border-t border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                        <MessageSquare size={18} />
                      </div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Direct Contacts</h4>
                    </div>

                    <div className="space-y-3">
                      {[
                        { icon: MessageSquare, label: 'Facebook Messenger', value: 'jjsportswearph', link: 'https://facebook.com/jjsportswearph', color: 'text-blue-400' },
                        { icon: Phone, label: 'Contact Number', value: '0912 345 6789', link: 'tel:09123456789', color: 'text-emerald-400' },
                        { icon: Mail, label: 'Email Address', value: 'contact@jjstrack.com', link: 'mailto:contact@jjstrack.com', color: 'text-amber-400' }
                      ].map((contact, i) => (
                        <a
                          key={i}
                          href={contact.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all group"
                        >
                          <div className="flex items-center gap-5">
                            <contact.icon size={20} className={contact.color} />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">{contact.label}</span>
                              <span className="text-xs font-bold text-white uppercase tracking-wider">{contact.value}</span>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="pb-12 text-center sm:text-left">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] leading-relaxed">
                      © 2026 JJSTRACK APPAREL. <br className="sm:hidden" /> ALL RIGHTS RESERVED.
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
