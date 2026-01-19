
import React, { useState, useEffect, useMemo } from 'react';
import { DiaryEntry } from '../types';
import { getDiariesByYear, getAllYears } from '../db';

interface DiaryListProps {
  onSelect: (entry: DiaryEntry) => void;
  onAdd: () => void;
  onGoSettings: () => void;
}

const DiaryList: React.FC<DiaryListProps> = ({ onSelect, onAdd, onGoSettings }) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const y = await getAllYears();
      setYears(y);
      if (y.length > 0 && !y.includes(currentYear)) {
        setCurrentYear(y[0]);
      }
      const data = await getDiariesByYear(currentYear);
      setEntries(data);
      setLoading(false);
    };
    fetchData();
  }, [currentYear]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    return entries.filter(e => 
      e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [entries, searchQuery]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <div className="flex flex-col h-screen bg-bg-light dark:bg-bg-dark">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border-b border-pink-100 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
        {!isSearching ? (
          <>
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-primary text-2xl">book</span>
              <h1 className="text-lg font-bold tracking-tight dark:text-white">日記録</h1>
              <span className="text-[10px] text-gray-400 font-bold ml-1 mt-1">{currentYear}年</span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsSearching(true)}
                className="p-2 rounded-full text-gray-500 hover:bg-pink-50 transition-colors"
              >
                <span className="material-icons-round text-xl">search</span>
              </button>
              <div className="relative">
                <select 
                  value={currentYear} 
                  onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                >
                  {years.map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
                <button className="p-2 rounded-full text-gray-500 hover:bg-pink-50 transition-colors">
                  <span className="material-icons-round text-xl">filter_list</span>
                </button>
              </div>
              <button 
                onClick={onAdd}
                className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <span className="material-icons-round text-xl">add</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center w-full gap-2 animate-in slide-in-from-top-2 duration-200">
            <div className="flex-1 flex items-center bg-gray-100 dark:bg-zinc-800 rounded-full px-4 py-1.5">
              <span className="material-icons-round text-gray-400 text-sm mr-2">search</span>
              <input 
                autoFocus
                type="text"
                placeholder="検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-sm w-full focus:ring-0 p-0 dark:text-white"
              />
            </div>
            <button 
              onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              className="text-primary text-sm font-bold px-2"
            >
              キャンセル
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-3 no-scrollbar pb-24">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-pink-100 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50 space-y-4">
            <span className="material-icons-round text-7xl">sentiment_dissatisfied</span>
            <p className="text-sm font-medium">思い出が見つかりません</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-x-3 gap-y-5 px-1">
            {filteredEntries.map((entry) => (
              <article 
                key={entry.id} 
                onClick={() => onSelect(entry)}
                className="group relative flex flex-col cursor-pointer active:scale-95 transition-transform"
              >
                <div className={`${entry.images.length > 1 ? 'stack-effect' : ''} bg-white dark:bg-zinc-800 rounded-lg`}>
                  <div className="aspect-square bg-white dark:bg-zinc-700 relative overflow-hidden rounded-lg shadow-sm border border-pink-50 dark:border-zinc-700 flex items-center justify-center">
                    {entry.images.length > 0 ? (
                      <img 
                        src={entry.images[0]} 
                        alt="" 
                        className="max-w-full max-h-full object-scale-down transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl select-none">
                        {entry.mood}
                      </div>
                    )}
                    {entry.images.length > 1 && (
                      <div className="absolute top-1 right-1 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-md border border-white/20">
                        {entry.images.length}枚
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 px-1">
                  <div className="text-[10px] text-gray-400 font-bold mb-0.5">
                    {formatDate(entry.date)}
                  </div>
                  <p className="text-[10px] sm:text-xs leading-snug text-gray-600 dark:text-gray-300 line-clamp-2">
                    {entry.content}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {!isSearching && (
        <button 
          onClick={onAdd}
          className="fixed bottom-24 right-6 w-12 h-12 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-pink-600 active:scale-90 transition-all z-40"
        >
          <span className="material-icons-round text-2xl">edit</span>
        </button>
      )}

      <nav className="fixed bottom-0 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-pink-50 dark:border-zinc-800 pb-safe pt-2 px-12 flex justify-between items-center z-50 h-16">
        <button className="flex flex-col items-center gap-1 text-primary">
          <span className="material-icons-round text-2xl">grid_view</span>
          <span className="text-[9px] font-bold">ログ</span>
        </button>
        <button 
          onClick={onGoSettings}
          className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-primary transition-colors"
        >
          <span className="material-icons-round text-2xl">person</span>
          <span className="text-[9px] font-bold">マイページ</span>
        </button>
      </nav>

      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </div>
  );
};

export default DiaryList;
