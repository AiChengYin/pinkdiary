
import React, { useState, useEffect, useRef } from 'react';
import { getSetting, setSetting, db } from '../db';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

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

// Compression utilities using native CompressionStream API
async function compressData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const inputBytes = encoder.encode(data);

  // Use gzip compression
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(inputBytes);
  writer.close();

  const compressedChunks: Uint8Array[] = [];
  const reader = cs.readable.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    compressedChunks.push(value);
  }

  // Combine chunks
  const totalLength = compressedChunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const compressedBytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of compressedChunks) {
    compressedBytes.set(chunk, offset);
    offset += chunk.length;
  }

  // Convert to base64
  let binary = '';
  for (let i = 0; i < compressedBytes.length; i++) {
    binary += String.fromCharCode(compressedBytes[i]);
  }
  return btoa(binary);
}

async function decompressData(base64Data: string): Promise<string> {
  // Decode base64
  const binary = atob(base64Data);
  const compressedBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    compressedBytes[i] = binary.charCodeAt(i);
  }

  // Use gzip decompression
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(compressedBytes);
  writer.close();

  const decompressedChunks: Uint8Array[] = [];
  const reader = ds.readable.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    decompressedChunks.push(value);
  }

  // Combine chunks
  const totalLength = decompressedChunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const decompressedBytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of decompressedChunks) {
    decompressedBytes.set(chunk, offset);
    offset += chunk.length;
  }

  const decoder = new TextDecoder();
  return decoder.decode(decompressedBytes);
}

const MyPage: React.FC<MyPageProps> = ({ onBack }) => {
  const [userName, setUserName] = useState('ユーザー様');
  const [avatar, setAvatar] = useState('🌸');
  const [bgValue, setBgValue] = useState('#ffffff');
  const [bgIsImage, setBgIsImage] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const name = await getSetting('user_name', 'ユーザー様');
      const av = await getSetting('user_avatar', '🌸');
      const bg = await getSetting('default_bg_value', '#ffffff');
      const isImg = await getSetting('bg_is_image', false);

      setUserName(name);
      setAvatar(av);
      setBgValue(bg);
      setBgIsImage(isImg);
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    await setSetting('user_name', userName);
    await setSetting('user_avatar', avatar);
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

  // Backup function - by month
  const handleBackup = async () => {
    if (isBackingUp) return;

    // Get current year and month as default
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Ask user for year and month
    const yearInput = window.prompt(
      'バックアップする年を入力してください：',
      String(currentYear)
    );
    if (!yearInput) return;

    const year = parseInt(yearInput, 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      alert('有効な年を入力してください（2000-2100）');
      return;
    }

    const monthInput = window.prompt(
      'バックアップする月を入力してください（1-12）：',
      String(currentMonth)
    );
    if (!monthInput) return;

    const month = parseInt(monthInput, 10);
    if (isNaN(month) || month < 1 || month > 12) {
      alert('有効な月を入力してください（1-12）');
      return;
    }

    setIsBackingUp(true);

    try {
      // Calculate date range for the selected month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month

      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      // Filter diaries by date range
      const allDiaries = await db.diaries.toArray();
      const filteredDiaries = allDiaries.filter(d => {
        const diaryDate = d.date;
        return diaryDate >= startISO.split('T')[0] && diaryDate <= endISO.split('T')[0];
      });

      if (filteredDiaries.length === 0) {
        alert(`${year}年${month}月の日記はありません。`);
        setIsBackingUp(false);
        return;
      }

      const backupData = {
        version: 2,
        type: 'monthly',
        year,
        month,
        timestamp: new Date().toISOString(),
        diaries: filteredDiaries
      };

      const jsonData = JSON.stringify(backupData);
      const originalSize = new Blob([jsonData]).size;

      // Compress data
      const compressedData = await compressData(jsonData);
      const compressedSize = new Blob([compressedData]).size;

      const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      console.log(`Compression: ${originalSize} -> ${compressedSize} bytes (${compressionRatio}% reduced)`);

      // Filename includes year and month
      const monthStr = String(month).padStart(2, '0');
      const fileName = `PinkDiary_${year}年${monthStr}月.pdbak`;

      if (Capacitor.isNativePlatform()) {
        try {
          await Filesystem.writeFile({
            path: fileName,
            data: compressedData,
            directory: Directory.Documents,
            encoding: Encoding.UTF8
          });
          alert(`バックアップが完了しました！📦\n\n対象: ${year}年${month}月\n保存先: Documents/${fileName}\n圧縮率: ${compressionRatio}%\n日記: ${filteredDiaries.length}件`);
        } catch (e: any) {
          console.error('Backup save failed:', e);
          downloadAsFile(compressedData, fileName);
        }
      } else {
        downloadAsFile(compressedData, fileName);
        alert(`バックアップが完了しました！📦\n\n対象: ${year}年${month}月\n圧縮率: ${compressionRatio}%\n日記: ${filteredDiaries.length}件`);
      }
    } catch (error: any) {
      console.error('Backup failed:', error);
      alert('バックアップに失敗しました。\n\nエラー: ' + (error.message || error));
    } finally {
      setIsBackingUp(false);
    }
  };

  const downloadAsFile = (data: string, fileName: string) => {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Restore function
  const handleRestoreClick = () => {
    restoreInputRef.current?.click();
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isRestoring) return;
    setIsRestoring(true);

    try {
      const compressedData = await file.text();

      // Decompress data
      const jsonData = await decompressData(compressedData);
      const backupData = JSON.parse(jsonData);

      if (!backupData.diaries) {
        throw new Error('無効なバックアップファイルです');
      }

      const diaryCount = backupData.diaries.length;
      let confirmMessage = '';
      let isMonthly = false;
      let dateRange = { start: '', end: '' };

      if (backupData.version === 2 && backupData.type === 'monthly') {
        isMonthly = true;
        const { year, month } = backupData;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        dateRange.start = startDate.toISOString().split('T')[0];
        dateRange.end = endDate.toISOString().split('T')[0];

        confirmMessage =
          `【月次データの復元】\n` +
          `対象: ${year}年${month}月\n` +
          `📝 日記数: ${diaryCount}件\n\n` +
          `⚠️ この月の既存データは上書きされます。\n` +
          `（他の月のデータは保持されます）`;
      } else {
        // Version 1 or unknown (Full backup)
        const backupDate = backupData.timestamp ? new Date(backupData.timestamp).toLocaleDateString('ja-JP') : '不明';
        confirmMessage =
          `【全データの復元】\n` +
          `📅 バックアップ日: ${backupDate}\n` +
          `📝 日記数: ${diaryCount}件\n\n` +
          `⚠️ 警告: 現在の全てのデータが消去され、上書きされます。`;
      }

      // Confirm restore
      const confirmed = window.confirm(confirmMessage + `\n\n復元しますか？`);

      if (!confirmed) {
        setIsRestoring(false);
        return;
      }

      if (isMonthly) {
        // For monthly backup: Delete only target month's data
        console.log(`Clearing data from ${dateRange.start} to ${dateRange.end}`);

        // Find IDs to delete in this range
        const existingInMonth = await db.diaries
          .where('date')
          .between(dateRange.start, dateRange.end, true, true)
          .toArray();

        const idsToDelete = existingInMonth.map(d => d.id).filter((id): id is number => id !== undefined);
        if (idsToDelete.length > 0) {
          await db.diaries.bulkDelete(idsToDelete);
        }

        // Insert new data
        if (backupData.diaries.length > 0) {
          await db.diaries.bulkPut(backupData.diaries);
        }
      } else {
        // Full Restore: Clear everything
        await db.diaries.clear();
        await db.settings.clear();

        if (backupData.diaries?.length > 0) {
          await db.diaries.bulkPut(backupData.diaries);
        }
        if (backupData.settings?.length > 0) {
          await db.settings.bulkPut(backupData.settings);
        }

        // Reload settings in UI
        const name = await getSetting('user_name', 'ユーザー様');
        const av = await getSetting('user_avatar', '🌸');
        const bg = await getSetting('default_bg_value', '#ffffff');
        const isImg = await getSetting('bg_is_image', false);
        setUserName(name);
        setAvatar(av);
        setBgValue(bg);
        setBgIsImage(isImg);
      }

      alert(`復元が完了しました！🎉\n\n日記 ${diaryCount}件 を復元しました。`);
    } catch (error: any) {
      console.error('Restore failed:', error);
      if (error.message?.includes('gunzip')) {
        alert('バックアップファイルの解凍に失敗しました。\nファイルが壊れているか、形式が正しくありません。');
      } else {
        alert('復元に失敗しました。\n\nエラー: ' + (error.message || error));
      }
    } finally {
      setIsRestoring(false);
      // Reset input
      if (restoreInputRef.current) {
        restoreInputRef.current.value = '';
      }
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

        {/* Backup & Restore Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="material-icons-round text-primary text-xl">backup</span>
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">バックアップ・復元</h3>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 shadow-sm border border-pink-50 dark:border-zinc-700 space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              大切な日記データをバックアップして、いつでも復元できます。定期的なバックアップをおすすめします。
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleBackup}
                disabled={isBackingUp}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-all disabled:opacity-50"
              >
                <span className="material-icons-round text-lg">{isBackingUp ? 'hourglass_top' : 'cloud_upload'}</span>
                <span className="text-sm">{isBackingUp ? '処理中...' : 'バックアップ'}</span>
              </button>
              <button
                onClick={handleRestoreClick}
                disabled={isRestoring}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none active:scale-95 transition-all disabled:opacity-50"
              >
                <span className="material-icons-round text-lg">{isRestoring ? 'hourglass_top' : 'cloud_download'}</span>
                <span className="text-sm">{isRestoring ? '処理中...' : '復元'}</span>
              </button>
            </div>
            <input
              ref={restoreInputRef}
              type="file"
              accept=".pdbak"
              className="hidden"
              onChange={handleRestoreFile}
            />
          </div>
          <p className="px-2 text-[9px] text-gray-400 leading-relaxed italic">
            ※ バックアップファイル（.pdbak）は圧縮されています。復元時は同じアプリで作成したファイルをご使用ください。
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
