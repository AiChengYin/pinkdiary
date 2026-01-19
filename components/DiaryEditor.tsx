
import React, { useState } from 'react';
import { DiaryEntry, Mood } from '../types';
import { saveDiary } from '../db';
import { Geolocation } from '@capacitor/geolocation';

interface DiaryEditorProps {
  entry?: DiaryEntry | null;
  onBack: () => void;
  onSave: () => void;
}

const DiaryEditor: React.FC<DiaryEditorProps> = ({ entry, onBack, onSave }) => {
  const [content, setContent] = useState(entry?.content || '');
  const [mood, setMood] = useState<Mood>((entry?.mood as Mood) || Mood.EXCITED);
  const [images, setImages] = useState<string[]>(entry?.images || []);
  const [date, setDate] = useState(entry?.date ? entry.date.split('T')[0] : new Date().toISOString().split('T')[0]);
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [location, setLocation] = useState(entry?.location || '');
  const [newTag, setNewTag] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files as FileList).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string].slice(0, 9));
      };
      reader.readAsDataURL(file as Blob);
    });
  };

  const handleGetLocation = async () => {
    setIsLocating(true);

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const { latitude, longitude } = position.coords;
      let locationName = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
          headers: { 'Accept-Language': 'ja-JP' }
        });
        const data = await response.json();
        if (data && data.address) {
          locationName = data.address.city || data.address.town || data.address.suburb || data.address.village || data.display_name.split(',')[0];
        }
      } catch (error) {
        console.error("Geocoding failed", error);
      }

      setLocation(locationName);
    } catch (error) {
      console.error("Geolocation error:", error);
      alert("位置情報を取得できません。アプリの位置情報権限を確認してください。");
    } finally {
      setIsLocating(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return alert('何か書いてください〜');

    const diaryDate = new Date(date);
    const newEntry: DiaryEntry = {
      ...(entry?.id && { id: entry.id }),
      content,
      mood,
      images,
      date: diaryDate.toISOString(),
      year: diaryDate.getFullYear(),
      tags,
      location: location || '場所未設定'
    };

    await saveDiary(newEntry);
    onSave();
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-900 overflow-hidden">
      <header className="px-6 py-4 flex items-center justify-between border-b border-pink-50 dark:border-zinc-800 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 active:scale-90 transition-transform">
          <span className="material-icons-round">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold dark:text-white">{entry ? '日記を編集' : '新しい日記'}</h1>
        <button
          onClick={onBack}
          className="text-gray-400 font-bold text-sm px-3 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          キャンセル
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-40">
        <div className="p-6">
          <div className="grid grid-cols-3 gap-3 mb-6">
            <label className="aspect-square bg-pink-50 dark:bg-zinc-800 rounded-2xl border-2 border-dashed border-pink-200 dark:border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:bg-pink-100 transition-colors">
              <span className="material-icons-round text-primary">add_a_photo</span>
              <span className="text-[10px] font-bold text-gray-500 mt-1">写真を追加</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            {images.map((img, i) => (
              <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group">
                <img src={img} className="w-full h-full object-cover" alt="" />
                <button
                  onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"
                >
                  <span className="material-icons-round text-xs">close</span>
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-8">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-pink-50 dark:bg-zinc-800 border-none rounded-xl text-sm font-bold px-4 py-2.5 focus:ring-primary text-gray-700 dark:text-gray-200"
            />
            <div className="flex gap-1.5">
              {Object.values(Mood).map(m => (
                <button
                  key={m}
                  onClick={() => setMood(m as Mood)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${mood === m ? 'bg-white border-2 border-primary scale-110 shadow-sm' : 'grayscale opacity-40'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-8 bg-pink-50/50 dark:bg-zinc-800/50 px-4 py-3 rounded-2xl group">
            <button
              onClick={handleGetLocation}
              disabled={isLocating}
              className={`flex shrink-0 items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-zinc-700 text-primary shadow-sm active:scale-90 transition-all ${isLocating ? 'animate-pulse' : ''}`}
            >
              <span className="material-icons-round text-xl">{isLocating ? 'hourglass_top' : 'near_me'}</span>
            </button>
            <div className="flex-1 flex flex-col min-w-0">
              <span className="text-[9px] font-bold text-pink-400 uppercase tracking-widest mb-0.5">足跡</span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={isLocating ? "位置取得中..." : "今どこにいますか？"}
                className="bg-transparent border-none p-0 text-sm font-bold text-gray-600 dark:text-gray-300 focus:ring-0 placeholder:text-gray-300"
              />
            </div>
            {location && (
              <button onClick={() => setLocation('')} className="text-gray-300 hover:text-gray-400">
                <span className="material-icons-round text-sm">cancel</span>
              </button>
            )}
          </div>

          <div className="mb-8">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="今の気持ちを書き留めましょう..."
              className="w-full min-h-[300px] bg-transparent border-none p-0 text-lg leading-relaxed focus:ring-0 text-gray-700 dark:text-gray-200 resize-none font-hand"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span key={tag} className="px-3 py-1.5 rounded-xl bg-pink-50 dark:bg-zinc-800 text-primary text-[11px] font-bold border border-pink-100 dark:border-zinc-700 flex items-center gap-1.5">
                #{tag}
                <button onClick={() => setTags(tags.filter(t => t !== tag))}><span className="material-icons-round text-[14px]">close</span></button>
              </span>
            ))}
            <div className="flex items-center bg-gray-50 dark:bg-zinc-800 rounded-xl px-3 py-1.5">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                placeholder="タグを追加"
                className="w-16 bg-transparent border-none text-[11px] font-bold p-0 focus:ring-0"
              />
              <button onClick={addTag} className="ml-1 text-primary"><span className="material-icons-round text-sm">add</span></button>
            </div>
          </div>
        </div>
      </main>

      <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-white via-white dark:from-zinc-900 dark:via-zinc-900 pt-12">
        <button
          onClick={handleSave}
          className="w-full bg-primary hover:bg-pink-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-pink-200 dark:shadow-none flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span className="material-icons-round">check_circle</span>
          <span className="tracking-widest">日記を保存</span>
        </button>
      </div>
    </div>
  );
};

export default DiaryEditor;
