
import React, { useState, useEffect } from 'react';
import DiaryList from './components/DiaryList';
import DiaryEditor from './components/DiaryEditor';
import DiaryViewer from './components/DiaryViewer';
import MyPage from './components/MyPage';
import { DiaryEntry } from './types';
import { db } from './db';

const App: React.FC = () => {
  const [view, setView] = useState<'list' | 'edit' | 'view' | 'settings'>('list');
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#list' || hash === '') {
        setView('list');
      } else if (hash === '#edit') {
        setView('edit');
      } else if (hash === '#settings') {
        setView('settings');
      } else if (hash.startsWith('#view/')) {
        const id = parseInt(hash.split('/')[1]);
        db.diaries.get(id).then(entry => {
          if (entry) {
            setSelectedEntry(entry);
            setView('view');
          } else {
            window.location.hash = '#list';
          }
        });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (newView: 'list' | 'edit' | 'view' | 'settings', entry?: DiaryEntry | null) => {
    if (entry !== undefined) setSelectedEntry(entry);
    
    if (newView === 'list') {
      window.location.hash = '#list';
    } else if (newView === 'edit') {
      window.location.hash = '#edit';
    } else if (newView === 'settings') {
      window.location.hash = '#settings';
    } else if (newView === 'view' && (entry?.id || selectedEntry?.id)) {
      const id = entry?.id || selectedEntry?.id;
      window.location.hash = `#view/${id}`;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white dark:bg-zinc-900 shadow-xl flex flex-col relative overflow-hidden transition-colors">
      {view === 'list' && (
        <DiaryList 
          onSelect={(entry) => navigateTo('view', entry)} 
          onAdd={() => navigateTo('edit', null)} 
          onGoSettings={() => navigateTo('settings', null)}
        />
      )}
      {view === 'edit' && (
        <DiaryEditor 
          entry={selectedEntry} 
          onBack={() => selectedEntry?.id ? navigateTo('view', selectedEntry) : navigateTo('list', null)} 
          onSave={() => navigateTo('list', null)} 
        />
      )}
      {view === 'view' && selectedEntry && (
        <DiaryViewer 
          entry={selectedEntry} 
          onBack={() => navigateTo('list', null)} 
          onEdit={() => navigateTo('edit', selectedEntry)} 
        />
      )}
      {view === 'settings' && (
        <MyPage 
          onBack={() => navigateTo('list', null)} 
        />
      )}
    </div>
  );
};

export default App;
