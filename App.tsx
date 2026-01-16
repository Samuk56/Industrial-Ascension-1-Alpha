
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Era, Resource, Building, Technology, GameEvent, ResourceType } from './types';
import { INITIAL_RESOURCES, BUILDINGS_DATA, TECHNOLOGIES_DATA, ERA_ORDER, BUILDING_ICONS } from './constants';
import { getEraDescription } from './geminiService';

// Persistent Audio Engine
class AudioEngine {
  private ctx: AudioContext | null = null;
  private init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  play(type: 'click' | 'build' | 'tech' | 'era' | 'upgrade') {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    const now = this.ctx.currentTime;
    if (type === 'click') {
      osc.frequency.setValueAtTime(220, now); osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
      gain.gain.setValueAtTime(0.08, now); gain.gain.linearRampToValueAtTime(0, now + 0.08);
    } else if (type === 'upgrade') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(330, now); osc.frequency.linearRampToValueAtTime(660, now + 0.2);
      gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now + 0.2);
    } else {
      osc.frequency.setValueAtTime(type === 'build' ? 150 : 440, now);
      gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.3);
    }
    osc.start(); osc.stop(now + 1);
  }
}

const audioEngine = new AudioEngine();

const WorldSimulation: React.FC<{ 
  era: Era, 
  buildings: Building[], 
  onCollect: (type: ResourceType) => void,
  manualClickPower: number 
}> = ({ era, buildings, onCollect, manualClickPower }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); e.stopPropagation();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.min(Math.max(prev * delta, 0.4), 4));
    };
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const bgStyle = useMemo(() => {
    switch (era) {
      case Era.STONE: return 'bg-[#1a130c] bg-[radial-gradient(#3d2b1f_2px,transparent_2px)] [background-size:60px_60px]';
      case Era.INDUSTRIAL: return 'bg-[#0f0f0f] bg-[radial-gradient(#222_2px,transparent_2px)] [background-size:80px_80px]';
      case Era.FUTURE: return 'bg-[#010414] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:30px_30px] shadow-[inset_0_0_200px_rgba(56,189,248,0.05)]';
      default: return 'bg-slate-950';
    }
  }, [era]);

  const districts = useMemo(() => {
    return buildings.filter(b => b.count > 0).map((b, idx) => {
      const angle = (idx / buildings.length) * Math.PI * 2;
      const dist = 160 + (idx * 15);
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      
      return (
        <div 
          key={b.id}
          className="absolute flex flex-col items-center group pointer-events-none transition-all duration-700"
          style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="relative">
             <span className="text-8xl emoji drop-shadow-[0_25px_30px_rgba(0,0,0,0.8)] building-unit">
               {BUILDING_ICONS[b.id]}
             </span>
             <div className="absolute -top-6 -right-6 bg-emerald-500 text-white text-[14px] font-black px-4 py-1 rounded-full border-4 border-slate-950 shadow-2xl animate-bounce">
                {b.count}
             </div>
          </div>
          <div className="mt-4 bg-slate-950/90 backdrop-blur-xl px-4 py-1.5 rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
             <span className="text-[12px] text-emerald-400 font-black uppercase tracking-widest">NÍVEL {b.level}</span>
          </div>
        </div>
      );
    });
  }, [buildings]);

  const nodes = [
    { type: 'sticks' as ResourceType, x: -300, y: -200, icon: '🌿' },
    { type: 'sticks' as ResourceType, x: -250, y: 250, icon: '🌿' },
    { type: 'stones' as ResourceType, x: 300, y: -280, icon: '⛰️' },
    { type: 'stones' as ResourceType, x: 280, y: 180, icon: '⛰️' },
    { type: 'sticks' as ResourceType, x: 50, y: -350, icon: '🌿' },
    { type: 'stones' as ResourceType, x: -100, y: 320, icon: '⛰️' },
  ];

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`absolute inset-0 w-full h-full overflow-hidden world-container ${bgStyle} transition-colors duration-1000 z-0`}
    >
      <div 
        className="absolute inset-0 transition-transform duration-500 ease-out will-change-transform"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
      >
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[180px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        
        {districts}

        {nodes.map((node, i) => (
          <button 
            key={i}
            onMouseDown={(e) => { e.stopPropagation(); onCollect(node.type); }}
            className="absolute text-7xl emoji hover:scale-125 active:scale-90 transition-all cursor-pointer drop-shadow-2xl select-none animate-float"
            style={{ 
              left: `calc(50% + ${node.x}px)`, 
              top: `calc(50% + ${node.y}px)`, 
              transform: 'translate(-50%, -50%)',
              animationDelay: `${i * 0.7}s`
            }}
          >
            {node.icon}
          </button>
        ))}

        {buildings.filter(b => b.count > 0).length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center opacity-10 flex-col pointer-events-none">
            <span className="text-[15rem] emoji mb-12">🌳</span>
            <span className="text-3xl font-black uppercase tracking-[2em] text-white">Início dos Tempos</span>
            <p className="text-lg mt-8 tracking-[0.5em] text-emerald-400 font-bold">Explore a natureza ao redor</p>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [era, setEra] = useState<Era>(Era.STONE);
  const [resources, setResources] = useState<Record<ResourceType, Resource>>(
    Object.keys(INITIAL_RESOURCES).reduce((acc, key) => {
      acc[key as ResourceType] = {
        id: key as ResourceType,
        name: INITIAL_RESOURCES[key as ResourceType].name,
        icon: INITIAL_RESOURCES[key as ResourceType].icon,
        amount: 0,
        perSecond: 0
      };
      return acc;
    }, {} as Record<ResourceType, Resource>)
  );
  const [buildings, setBuildings] = useState<Building[]>(BUILDINGS_DATA);
  const [technologies, setTechnologies] = useState<Technology[]>(TECHNOLOGIES_DATA);
  const [manualClickPower, setManualClickPower] = useState(1);
  const [isShopOpen, setIsShopOpen] = useState(false);

  const getBuildingCost = (b: Building) => {
    const multiplier = Math.pow(1.01, b.count);
    const cost: Partial<Record<ResourceType, number>> = {};
    Object.entries(b.baseCost).forEach(([res, val]) => {
      cost[res as ResourceType] = Math.floor((val ?? 0) * multiplier);
    });
    return cost;
  };

  const getUpgradeCost = (b: Building) => {
    const multiplier = Math.pow(1.8, b.level);
    const cost: Partial<Record<ResourceType, number>> = {};
    Object.entries(b.baseCost).forEach(([res, val]) => {
      cost[res as ResourceType] = Math.floor((val ?? 0) * 10 * multiplier);
    });
    return cost;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setResources(prev => {
        const next = { ...prev };
        (Object.values(next) as Resource[]).forEach(r => {
          if (r && typeof r.amount === 'number' && typeof r.perSecond === 'number' && r.perSecond > 0) {
            r.amount = r.amount + (r.perSecond / 10);
          }
        });
        return next;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const handleManualCollect = (type: ResourceType) => {
    audioEngine.play('click');
    setResources(prev => ({
      ...prev,
      [type]: { ...prev[type], amount: prev[type].amount + manualClickPower }
    }));
  };

  const buyBuilding = (buildingId: string) => {
    const b = buildings.find(x => x.id === buildingId);
    if (!b) return;
    const currentCost = getBuildingCost(b);
    const canAfford = Object.entries(currentCost).every(([res, cost]) => (resources[res as ResourceType]?.amount ?? 0) >= (cost ?? 0));

    if (canAfford) {
      audioEngine.play('build');
      setResources(prev => {
        const next = { ...prev };
        Object.entries(currentCost).forEach(([res, cost]) => {
          const resource = next[res as ResourceType];
          if (resource && typeof cost === 'number') {
            resource.amount = resource.amount - cost;
          }
        });
        Object.entries(b.baseProduction).forEach(([res, prod]) => {
          const resource = next[res as ResourceType];
          if (resource && typeof prod === 'number') {
            resource.perSecond = resource.perSecond + (prod * b.level);
          }
        });
        return next;
      });
      setBuildings(prev => prev.map(item => item.id === buildingId ? { ...item, count: item.count + 1 } : item));
    }
  };

  const upgradeBuilding = (buildingId: string) => {
    const b = buildings.find(x => x.id === buildingId);
    if (!b || b.count === 0 || b.eraRequired !== era) return;
    const cost = getUpgradeCost(b);
    const canAfford = Object.entries(cost).every(([res, c]) => (resources[res as ResourceType]?.amount ?? 0) >= (c ?? 0));

    if (canAfford) {
      audioEngine.play('upgrade');
      setResources(prev => {
        const next = { ...prev };
        Object.entries(cost).forEach(([res, c]) => {
          const resource = next[res as ResourceType];
          if (resource && typeof c === 'number') {
            resource.amount = resource.amount - c;
          }
        });
        Object.entries(b.baseProduction).forEach(([res, prod]) => {
          const resource = next[res as ResourceType];
          if (resource && typeof prod === 'number') {
            resource.perSecond = resource.perSecond + (prod * b.count);
          }
        });
        return next;
      });
      setBuildings(prev => prev.map(item => item.id === buildingId ? { ...item, level: item.level + 1 } : item));
    }
  };

  const researchTech = async (techId: string) => {
    const t = technologies.find(x => x.id === techId);
    if (!t) return;
    const canAfford = Object.entries(t.cost).every(([res, cost]) => (resources[res as ResourceType]?.amount ?? 0) >= (cost ?? 0));
    if (canAfford) {
      audioEngine.play('tech');
      setResources(prev => {
        const next = { ...prev };
        Object.entries(t.cost).forEach(([res, cost]) => {
          if (typeof cost === 'number') next[res as ResourceType].amount -= cost;
        });
        return next;
      });
      setTechnologies(prev => prev.map(item => item.id === techId ? { ...item, unlocked: true } : item));
      if (t.id === 'tools') setManualClickPower(prev => prev * 8);
      if (t.unlocksEra) {
        audioEngine.play('era');
        await getEraDescription(t.unlocksEra);
        setEra(t.unlocksEra);
      }
    }
  };

  const availableBuildings = buildings.filter(b => b.eraRequired === era || ERA_ORDER.indexOf(b.eraRequired) < ERA_ORDER.indexOf(era));
  const availableTechs = technologies.filter(t => !t.unlocked && (t.eraRequired === era || ERA_ORDER.indexOf(t.eraRequired) < ERA_ORDER.indexOf(era)));

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-black selection:bg-emerald-500/30">
      
      {/* BACKGROUND SIMULATION */}
      <WorldSimulation 
        era={era} 
        buildings={buildings} 
        onCollect={handleManualCollect}
        manualClickPower={manualClickPower}
      />

      {/* FLOATING HUD - HEADER */}
      <div className="absolute top-0 inset-x-0 p-8 flex flex-col items-center pointer-events-none z-10">
        <header className="glass px-12 py-6 rounded-full flex items-center space-x-12 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] border border-white/10 pointer-events-auto">
          <div className="flex items-center space-x-4 border-r border-white/10 pr-10">
            <span className="text-3xl">🏛️</span>
            <div>
              <h1 className="text-xl font-[900] gradient-text tracking-tighter uppercase leading-none">Industrial Ascension</h1>
              <span className="text-[9px] text-emerald-400/60 uppercase tracking-[0.4em] font-black">{era}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-10">
            {(Object.values(resources) as Resource[]).filter(r => r.amount > 0 || r.id === 'sticks').slice(0, 5).map(r => (
              <div key={r.id} className="text-center group">
                <div className="flex items-center space-x-2">
                  <span className="text-xl emoji group-hover:scale-125 transition-transform">{r.icon}</span>
                  <span className="mono text-white font-[900] text-lg tracking-tighter">{Math.floor(r.amount).toLocaleString()}</span>
                </div>
                <div className="text-[8px] text-emerald-500/40 font-black uppercase tracking-widest mt-0.5">
                  {r.perSecond > 0 ? `+${r.perSecond.toFixed(1)}/s` : r.name}
                </div>
              </div>
            ))}
          </div>
        </header>
      </div>

      {/* SIMPLIFIED SHOP BUTTON (EMOJI ONLY) */}
      <button 
        onClick={() => setIsShopOpen(true)}
        className="absolute bottom-10 right-10 w-24 h-24 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center text-4xl shadow-[0_25px_50px_-12px_rgba(5,150,105,0.6)] hover:-translate-y-2 active:scale-95 transition-all z-20 border-b-8 border-emerald-800"
        title="Menu de Construção"
      >
        🛠️
      </button>

      {/* FULL-SCREEN SHOP MODAL */}
      {isShopOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-20 bg-slate-950/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
          <div className="w-full max-w-6xl glass rounded-[4rem] border border-white/10 shadow-[0_0_150px_rgba(0,0,0,1)] flex flex-col max-h-full overflow-hidden">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-slate-900/40">
              <div>
                <h2 className="text-4xl font-[900] text-white tracking-tighter uppercase">Arquitetura de Destino</h2>
                <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] uppercase mt-2 opacity-60">Planeje a expansão da sua supremacia industrial</p>
              </div>
              <button 
                onClick={() => setIsShopOpen(false)}
                className="w-16 h-16 rounded-full bg-slate-800 hover:bg-rose-500 text-white flex items-center justify-center text-2xl transition-all border border-white/10"
              >
                ✕
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-12 space-y-16 custom-scrollbar">
              {/* Inovações Tecnológicas */}
              {availableTechs.length > 0 && (
                <section>
                  <h3 className="text-amber-500 font-black uppercase text-xs tracking-[0.5em] mb-10 flex items-center">
                    <span className="w-12 h-0.5 bg-amber-500/20 mr-6"></span> Fronteira do Conhecimento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {availableTechs.map(t => {
                      const canAfford = Object.entries(t.cost).every(([res, cost]) => (resources[res as ResourceType]?.amount ?? 0) >= (cost ?? 0));
                      return (
                        <div key={t.id} className="p-10 bg-slate-900/40 rounded-[3rem] border border-amber-500/10 group hover:border-amber-500/40 transition-all flex justify-between items-center gap-8 shadow-inner">
                          <div className="space-y-4">
                            <h4 className="text-2xl font-black text-amber-50 uppercase tracking-tight">{t.name}</h4>
                            <p className="text-[12px] text-slate-400 italic leading-relaxed font-medium">"{t.description}"</p>
                          </div>
                          <button onClick={() => researchTech(t.id)} disabled={!canAfford} className={`shrink-0 px-8 py-6 rounded-full font-black text-xs uppercase tracking-widest transition-all flex flex-col items-center gap-2 ${canAfford ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>
                            <span>Dominar</span>
                            <div className="flex gap-2 text-[9px] opacity-80">
                               {Object.entries(t.cost).map(([res, cost]) => (
                                 <span key={res}>{cost}{INITIAL_RESOURCES[res as ResourceType].icon}</span>
                               ))}
                            </div>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Construções e Upgrades */}
              <section>
                <h3 className="text-emerald-500 font-black uppercase text-xs tracking-[0.5em] mb-10 flex items-center">
                  <span className="w-12 h-0.5 bg-emerald-500/20 mr-6"></span> Matriz de Infraestrutura
                </h3>
                <div className="grid grid-cols-1 gap-10">
                  {availableBuildings.map(b => {
                    const currentCost = getBuildingCost(b);
                    const upgradeCost = getUpgradeCost(b);
                    const canAffordBuy = Object.entries(currentCost).every(([res, cost]) => (resources[res as ResourceType]?.amount ?? 0) >= (cost ?? 0));
                    const canAffordUpgrade = Object.entries(upgradeCost).every(([res, cost]) => (resources[res as ResourceType]?.amount ?? 0) >= (cost ?? 0));
                    const isCorrectEraForUpgrade = b.eraRequired === era;
                    
                    const percentIncrease = b.level > 0 ? (1 / b.level) * 100 : 100;

                    return (
                      <div key={b.id} className="p-12 bg-slate-900/30 rounded-[4rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-12 group hover:bg-slate-900/50 transition-all shadow-2xl">
                        <div className="flex items-center space-x-12">
                          <div className="w-36 h-36 bg-slate-950 rounded-[3rem] flex items-center justify-center text-7xl emoji shadow-[inset_0_4px_30px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-500">
                            {BUILDING_ICONS[b.id]}
                          </div>
                          <div className="max-w-md">
                            <div className="flex items-center space-x-6 mb-4">
                              <h4 className="text-4xl font-black text-white uppercase tracking-tighter">{b.name}</h4>
                              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-5 py-2 rounded-full font-black text-xs">x{b.count}</div>
                            </div>
                            <p className="text-sm text-slate-400 font-bold italic opacity-70 leading-relaxed">"{b.description}"</p>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-6 w-full md:w-auto shrink-0">
                          <button 
                            onClick={() => buyBuilding(b.id)}
                            disabled={!canAffordBuy}
                            className={`py-8 px-12 rounded-[2.5rem] font-black text-xs uppercase tracking-widest transition-all flex flex-col items-center gap-2 ${canAffordBuy ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl' : 'bg-slate-800 text-slate-700 cursor-not-allowed'}`}
                          >
                            <span>Expandir (+1)</span>
                            <div className="flex gap-2 text-[10px] font-mono opacity-80">
                               {Object.entries(currentCost).map(([res, cost]) => (
                                 <span key={res}>{cost}{INITIAL_RESOURCES[res as ResourceType].icon}</span>
                               ))}
                            </div>
                          </button>
                          
                          <button 
                            onClick={() => upgradeBuilding(b.id)}
                            disabled={!canAffordUpgrade || b.count === 0 || !isCorrectEraForUpgrade}
                            className={`py-8 px-12 rounded-[2.5rem] font-black text-xs uppercase tracking-widest border-4 transition-all flex flex-col items-center gap-2 group/upgrade ${canAffordUpgrade && b.count > 0 && isCorrectEraForUpgrade ? 'border-amber-600/40 text-amber-500 hover:bg-amber-600 hover:text-white shadow-xl' : 'border-slate-800 text-slate-800 cursor-not-allowed'}`}
                          >
                            <span>Evoluir Nível {b.level + 1}</span>
                            {!isCorrectEraForUpgrade ? (
                               <span className="text-[9px] text-rose-400 uppercase tracking-tighter">Somente em: {b.eraRequired}</span>
                            ) : (
                              <div className="flex gap-2 text-[10px] font-mono opacity-80">
                                 {Object.entries(upgradeCost).map(([res, cost]) => (
                                   <span key={res}>{cost}{INITIAL_RESOURCES[res as ResourceType].icon}</span>
                                 ))}
                              </div>
                            )}
                            {b.count > 0 && isCorrectEraForUpgrade && <span className="text-[10px] opacity-60 font-black">+{percentIncrease.toFixed(0)}% Eficiência</span>}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
            
            <div className="p-10 bg-slate-900/60 border-t border-white/5 flex justify-center text-[10px] text-slate-600 font-black uppercase tracking-[2em] opacity-40">
               Controle Geopolítico V4.0
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
