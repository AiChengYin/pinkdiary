
import React, { useState, useEffect, useRef } from 'react';
import { getSetting, setSetting } from '../db';
import { Capacitor } from '@capacitor/core';

interface MyPageProps {
  onBack: () => void;
}

const BACKGROUND_PRESETS = [
  { name: 'Pure White', value: '#ffffff', type: 'color' },
  { name: 'Soft Pink', value: '#fff1f2', type: 'color' },
  { name: 'Warm Cream', value: '#fffbeb', type: 'color' },
  { name: 'Sky Blue', value: '#f0f9ff', type: 'color' },
  { name: 'Modern Zinc', value: '#f4f4f5', type: 'color' },
];

const MyPage: React.FC<MyPageProps> = ({ onBack }) => {
  const [userName, setUserName] = useState('ユーザー様');
  const [avatar, setAvatar] = useState('🌸');
  const [dbPath, setDbPath] = useState('');
  const [bgValue, setBgValue] = useState('#ffffff');
  const [bgIsImage, setBgIsImage] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const name = await getSetting('user_name', 'ユーザー様');
      const av = await getSetting('user_avatar', '🌸');
      const path = await getSetting('sqlite_path', 'Documents/PinkDiary/Data/');
      const bg = await getSetting('default_bg_value', '#ffffff');
      const isImg = await getSetting('bg_is_image', false);

      setUserName(name);
      setAvatar(av);
      setDbPath(path);
      setBgValue(bg);
      setBgIsImage(isImg);
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    await setSetting('user_name', userName);
    await setSetting('user_avatar', avatar);
    await setSetting('sqlite_path', dbPath);
    await setSetting('default_bg_value', bgValue);
    await setSetting('bg_is_image', bgIsImage);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBgValue(reader.result as string);
        setBgIsImage(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFolderClick = async () => {
    if (Capacitor.isNativePlatform()) {
      alert("Androidアプリでは、データは自動的に内部ストレージに保存されます。変更はできません。");
      return;
    }

    // Attempt modern Directory Picker for a native folder selection experience
    if ('showDirectoryPicker' in window) {
      try {
        const handle = await (window as any).showDirectoryPicker();
        setDbPath(`Device/${handle.name}/DiaryStorage/`);
      } catch (err) {
        console.warn('Picker cancelled or blocked', err);
      }
    } else {
      // Fallback for non-supported browsers
      folderInputRef.current?.click();
    }
  };

  const handleFolderSelectFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const pathPart = files[0].webkitRelativePath.split('/')[0] || '選択したフォルダ';
      setDbPath(`Device/${pathPart}/DiaryStorage/`);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-zinc-900 overflow-hidden">
      <header className="px-6 py-4 flex items-center justify-between border-b border-pink-50 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 active:scale-90 transition-transform">
          <span className="material-icons-round">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold dark:text-white">マイページ</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-32">
        {/* Profile Section */}
        <section className="bg-white dark:bg-zinc-800 rounded-3xl p-6 shadow-sm border border-pink-50 dark:border-zinc-700 flex flex-col items-center gap-4 text-center">
          <div className="relative group">
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-gradient-to-tr from-pink-400 to-pink-200 flex items-center justify-center text-white text-4xl overflow-hidden border-4 border-white dark:border-zinc-700 shadow-xl cursor-pointer active:scale-95 transition-transform"
            >
              {avatar.startsWith('data:') ? (
                <img src={avatar} className="w-full h-full object-cover" alt="avatar" />
              ) : (
                avatar
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-zinc-800 flex items-center justify-center"
            >
              <span className="material-icons-round text-sm">edit</span>
            </button>
            <input ref={avatarInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </div>

          <div className="w-full">
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full text-center bg-transparent border-none text-xl font-bold focus:ring-0 dark:text-white placeholder:text-gray-300"
              placeholder="お名前を入力"
            />
            <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-widest">Diary Member</p>
          </div>
        </section>

        {/* Data Storage Setting */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="material-icons-round text-primary text-xl">folder_shared</span>
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">データの保存先</h3>
          </div>
          <div
            onClick={handleFolderClick}
            className="bg-white dark:bg-zinc-800 rounded-2xl p-5 shadow-sm border border-pink-50 dark:border-zinc-700 cursor-pointer active:scale-[0.98] transition-all hover:bg-pink-50/20 dark:hover:bg-zinc-700/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-zinc-700 flex items-center justify-center text-primary">
                <span className="material-icons-round text-2xl">folder</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">
                  {dbPath.split('/').filter(Boolean).pop() || 'フォルダを選択'}
                </p>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{dbPath || '未設定'}</p>
              </div>
              <span className="material-icons-round text-gray-300">chevron_right</span>
            </div>
            {/* Standard fallback hidden input */}
            <input
              ref={folderInputRef}
              type="file"
              {...({ webkitdirectory: "true" } as any)}
              className="hidden"
              onChange={handleFolderSelectFallback}
            />
          </div>
          <p className="px-2 text-[9px] text-gray-400 leading-relaxed italic">
            ※ 日記のファイルが保存されるフォルダを指定します。
          </p>
        </section>

        {/* Design Setting */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="material-icons-round text-primary text-xl">palette</span>
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">手帳の背景</h3>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 shadow-sm border border-pink-50 dark:border-zinc-700">
            <div className="flex flex-wrap gap-4">
              {BACKGROUND_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => {
                    setBgValue(p.value);
                    setBgIsImage(false);
                  }}
                  style={{ backgroundColor: p.value }}
                  className={`w-11 h-11 rounded-full border-2 transition-all shadow-sm ${!bgIsImage && bgValue === p.value ? 'border-primary scale-110 ring-4 ring-pink-50 dark:ring-zinc-700' : 'border-gray-100 dark:border-zinc-700'}`}
                />
              ))}
              <div
                onClick={() => bgImageInputRef.current?.click()}
                className={`w-11 h-11 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all shadow-sm ${bgIsImage ? 'border-primary scale-110 ring-4 ring-pink-50 dark:ring-zinc-700' : 'border-gray-100 dark:border-zinc-700'}`}
              >
                <span className="material-icons-round text-xl text-gray-400">add_photo_alternate</span>
                <input ref={bgImageInputRef} type="file" className="hidden" accept="image/*" onChange={handleBgImageChange} />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-50 to-transparent dark:from-zinc-900 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <button
            onClick={handleSave}
            className={`w-full py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${isSaved ? 'bg-green-500 text-white' : 'bg-primary text-white shadow-pink-200 dark:shadow-none'}`}
          >
            <span className="material-icons-round">{isSaved ? 'done' : 'save'}</span>
            <span>{isSaved ? '設定を保存しました' : '設定を保存'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
