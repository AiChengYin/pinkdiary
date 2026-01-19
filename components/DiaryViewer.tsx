
import React, { useRef, useState, useEffect } from 'react';
import { DiaryEntry } from '../types';
import { getSetting } from '../db';
import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { Media } from '@capacitor-community/media';
import { Filesystem, Directory } from '@capacitor/filesystem';

interface DiaryViewerProps {
  entry: DiaryEntry;
  onBack: () => void;
  onEdit: () => void;
}

const DiaryViewer: React.FC<DiaryViewerProps> = ({ entry, onBack, onEdit }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [bgValue, setBgValue] = useState('#ffffff');
  const [bgIsImage, setBgIsImage] = useState(false);

  useEffect(() => {
    const loadBg = async () => {
      const bg = await getSetting('default_bg_value', '#ffffff');
      const isImg = await getSetting('bg_is_image', false);
      setBgValue(bg);
      setBgIsImage(isImg);
    };
    loadBg();
  }, []);



  const downloadImage = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 2,
        logging: false,
        allowTaint: true
      });

      const dataUrl = canvas.toDataURL('image/png', 0.9);

      if (Capacitor.isNativePlatform()) {
        try {
          // 1. Write to temporary file
          const fileName = `Diary-${entry.date.split('T')[0]}.png`;
          // Remove header "data:image/png;base64,"
          const base64Data = dataUrl.split(',')[1];

          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache
          });

          // 2. Save to gallery from file path
          await Media.savePhoto({
            path: savedFile.uri
          });

          alert('画像が保存されました！');
        } catch (e) {
          console.error('Save failed', e);
          alert('保存に失敗しました。ストレージ権限が必要かもしれません。');
        }
      } else {
        const link = document.createElement('a');
        link.download = `Diary-${entry.date.split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Failed to download image:', err);
      alert('保存に失敗しました。もう一度お試しください。');
    }
  };

  const formattedDate = new Date(entry.date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const getGridCols = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2 || count === 4) return 'grid-cols-2';
    return 'grid-cols-3';
  };

  const cardStyle: React.CSSProperties = bgIsImage
    ? { backgroundImage: `url(${bgValue})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: bgValue };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-black overflow-hidden">
      <header className="px-6 py-4 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur z-20 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 active:scale-90 transition-transform">
          <span className="material-icons-round text-xl">arrow_back_ios_new</span>
        </button>
        <span className="text-[10px] font-black tracking-[0.3em] text-gray-400 uppercase">思い出を振り返る</span>
        <button onClick={onEdit} className="p-2 -mr-2 text-primary active:scale-90 transition-transform">
          <span className="material-icons-round">edit_note</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-4">
        <div
          ref={cardRef}
          style={cardStyle}
          className="shadow-2xl flex flex-col w-full max-w-full rounded-3xl overflow-hidden h-auto relative"
        >
          {bgIsImage && (
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] pointer-events-none"></div>
          )}

          <div className="relative z-10">
            {entry.images.length > 0 ? (
              <div className={`grid ${getGridCols(entry.images.length)} gap-1 p-1 bg-black/5`}>
                {entry.images.map((img, index) => (
                  <div
                    key={index}
                    className={`relative flex items-center justify-center bg-white/50 dark:bg-zinc-800/50 overflow-hidden ${entry.images.length === 1 ? 'min-h-[200px]' : 'aspect-square'}`}
                  >
                    <img
                      src={img}
                      className="max-w-full max-h-full object-scale-down block"
                      alt=""
                      crossOrigin="anonymous"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-square w-full bg-black/5 flex items-center justify-center">
                <span className="text-8xl filter drop-shadow-xl select-none">{entry.mood}</span>
              </div>
            )}

            <div className="px-6 py-8 flex flex-col">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-3xl">{entry.mood}</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-tight">
                  {formattedDate}
                </h2>
              </div>

              <div className="relative mb-6">
                <div className="absolute -left-3 top-0 w-1 h-full bg-primary/20 opacity-50 rounded-full"></div>
                <p className="text-lg leading-[1.7] text-gray-700 dark:text-gray-200 font-hand whitespace-pre-wrap pl-3">
                  {entry.content}
                </p>
              </div>

              <div className="pt-4 border-t border-black/5 dark:border-white/5">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {entry.tags.map(t => (
                      <span
                        key={t}
                        className="inline-flex items-center justify-center text-[10px] text-primary bg-primary/10 dark:bg-primary/20 px-2.5 py-1 rounded-full font-bold border border-primary/10 leading-none h-6 box-border"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  {entry.location && (
                    <div className="flex items-center text-gray-400 text-[10px] tracking-wide font-medium">
                      <span className="material-icons-round text-[14px] mr-1 text-primary/30">near_me</span>
                      {entry.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="px-6 pb-10 pt-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-zinc-800 shrink-0">
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-zinc-800 text-gray-500 active:scale-90 transition-all"
          >
            <span className="material-icons-round">close</span>
          </button>
          <button
            onClick={downloadImage}
            className="flex-1 h-14 bg-primary hover:bg-pink-600 text-white font-bold rounded-2xl shadow-xl shadow-pink-200 dark:shadow-none active:scale-[0.96] transition-all flex items-center justify-center gap-3"
          >
            <span className="material-icons-round text-xl">download_for_offline</span>
            <span className="tracking-widest">手帳を保存</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiaryViewer;
