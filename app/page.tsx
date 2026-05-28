'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

import DeleteModal from '@/components/DeleteModal';
import ChatArea from '@/components/ChatArea';
import ScheduleList from '@/components/ScheduleList';
import SettingsArea from '@/components/SettingsArea'; // 🌟 追加：設定コンポーネント

export type Message = { role: 'user' | 'assistant'; text: string; isDeleteConfirm?: boolean; isUpdateConfirm?: boolean };
export type Schedule = { id: string; title: string; date: string | null; time: string | null };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🌟 変更：現在の選択タブに 'settings' を追加
  const [activeTab, setActiveTab] = useState<'chat' | 'schedule' | 'settings'>('chat');

  // 🌟 追加：ユーザーの呼び方の設定ステート（初期値は旦那様）
  const [userCallSign, setUserCallSign] = useState('旦那様');

  // 🌟 追加：ブラウザ（localStorage）に保存された呼び方を読み込む処理
  useEffect(() => {
    const savedCallSign = localStorage.getItem('userCallSign');
    if (savedCallSign) {
      setUserCallSign(savedCallSign);
    }
  }, []);

  // 🌟 追加：呼び方が変更されたら自動的にブラウザに記憶する処理
  useEffect(() => {
    localStorage.setItem('userCallSign', userCallSign);
  }, [userCallSign]);

  // 削除確認ポップアップのステート
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // 画面内手動編集モード用のステート
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  // チャット経由の確認待ちステート
  const [pendingDeleteSchedule, setPendingDeleteSchedule] = useState<{ id: string; title: string } | null>(null);
  const [pendingUpdateSchedule, setPendingUpdateSchedule] = useState<{
    id: string;
    title: string;
    newFields: { title: string; date: string | null; time: string | null };
  } | null>(null);

  // データベースから予定を読み込む処理
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'schedules'));
        const loadedData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title,
          date: doc.data().date,
          time: doc.data().time,
        }));
        setSchedules(loadedData);
      } catch (error) {
        console.error("データの読み込みに失敗しました:", error);
      }
    };
    loadSchedules();
  }, []);

  // チャット経由で削除を実行する関数
  const executeChatDelete = async (target: { id: string; title: string }) => {
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, 'schedules', target.id));
      setSchedules((prev) => prev.filter((s) => s.id !== target.id));
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `かしこまりました。「${target.title}」のご予定を削除いたしました。` }
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setPendingDeleteSchedule(null);
      setIsLoading(false);
    }
  };

  const executeChatCancel = () => {
    setMessages((prev) => [...prev, { role: 'assistant', text: 'かしこまりました。削除を取り消しました。' }]);
    setPendingDeleteSchedule(null);
  };

  // チャット経由で変更を実行する関数
  const executeChatUpdate = async (target: any) => {
    setIsLoading(true);
    try {
      const scheduleRef = doc(db, 'schedules', target.id);
      await updateDoc(scheduleRef, target.newFields);
      setSchedules((prev) => prev.map((s) => (s.id === target.id ? { ...s, ...target.newFields } : s)));
      setMessages((prev) => [...prev, { role: 'assistant', text: `かしこまりました。ご予定を変更いたしました。` }]);
    } catch (error) {
      console.error(error);
    } finally {
      setPendingUpdateSchedule(null);
      setIsLoading(false);
    }
  };

  const executeChatUpdateCancel = () => {
    setMessages((prev) => [...prev, { role: 'assistant', text: 'かしこまりました。変更を取り消しました。' }]);
    setPendingUpdateSchedule(null);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');

    if (pendingDeleteSchedule) {
      if (userMessage === 'はい' || userMessage === 'イエス' || userMessage === 'yes' || userMessage === 'お願いします') {
        await executeChatDelete(pendingDeleteSchedule);
      } else if (userMessage === 'いいえ' || userMessage === 'ノー' || userMessage === 'no' || userMessage === 'やめます') {
        executeChatCancel();
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', text: `申し訳ございません。「${pendingDeleteSchedule.title}」のご予定を削除してよろしいですか？「はい」か「いいえ」でお答えください。`, isDeleteConfirm: true }]);
      }
      return;
    }

    if (pendingUpdateSchedule) {
      if (userMessage === 'はい' || userMessage === 'イエス' || userMessage === 'yes' || userMessage === 'お願いします') {
        await executeChatUpdate(pendingUpdateSchedule);
      } else if (userMessage === 'いいえ' || userMessage === 'ノー' || userMessage === 'no' || userMessage === 'やめます') {
        executeChatUpdateCancel();
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', text: `申し訳ございません。ご予定を変更してよろしいですか？「はい」か「いいえ」でお答えください。`, isUpdateConfirm: true }]);
      }
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 🌟 変更：AIへ呼び方の希望（userCallSign）を一緒に同封して送信します
        body: JSON.stringify({ message: userMessage, userCallSign }),
      });

      if (response.status === 429) {
        setMessages((prev) => [...prev, { role: 'assistant', text: 'お疲れ様でございます。本日はもうお休みの時間（業務時間外）でございますよ。これ以上の夜なべは体に障りますので、続きはまた明日お申し付けくださいませ。さあ、明かりを消して目を閉じましょう。' }]);
        return;
      }

      if (!response.ok) throw new Error('通信エラー');
      const data = await response.json();

      if (data.action === 'delete' && data.targetTitle) {
        const matchedSchedule = schedules.find(s => s.title.includes(data.targetTitle) || data.targetTitle.includes(s.title));
        if (matchedSchedule) {
          setPendingDeleteSchedule({ id: matchedSchedule.id, title: matchedSchedule.title });
          setMessages((prev) => [...prev, { role: 'assistant', text: `「${matchedSchedule.title}」のご予定を削除します。よろしいですか？`, isDeleteConfirm: true }]);
        } else {
          setMessages((prev) => [...prev, { role: 'assistant', text: `該当する「${data.targetTitle}」というご予定が見つかりませんでした。` }]);
        }
      } 
      else if (data.action === 'update' && data.targetTitle) {
        const matchedSchedule = schedules.find(s => s.title.includes(data.targetTitle) || data.targetTitle.includes(s.title));
        if (matchedSchedule) {
          let changeDetails = [];
          if (data.title) changeDetails.push(`件名を「${data.title}」`);
          if (data.date) changeDetails.push(`日付を「${data.date}」`);
          if (data.time) changeDetails.push(`時間を「${data.time}」`);

          if (changeDetails.length > 0) {
            setPendingUpdateSchedule({
              id: matchedSchedule.id,
              title: matchedSchedule.title,
              newFields: { title: data.title || matchedSchedule.title, date: data.date || matchedSchedule.date, time: data.time || matchedSchedule.time }
            });
            setMessages((prev) => [...prev, { role: 'assistant', text: `「${matchedSchedule.title}」のご予定の、${changeDetails.join('、')}に変更いたします。よろしいですか？`, isUpdateConfirm: true }]);
          }
        }
      } 
      else {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
        if (data.title && data.action === 'create') {
          const newScheduleData = { title: data.title, date: data.date, time: data.time };
          const docRef = await addDoc(collection(db, 'schedules'), newScheduleData);
          setSchedules((prev) => [...prev, { id: docRef.id, ...newScheduleData }]);
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'assistant', text: '申し訳ございません。旦那様（お嬢様）、少々電波の調子が悪いようでございます。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteDoc(doc(db, 'schedules', deleteTargetId));
      setSchedules((prev) => prev.filter((s) => s.id !== deleteTargetId));
      setMessages((prev) => [...prev, { role: 'assistant', text: 'かしこまりました。ご予定を削除いたしました。' }]);
    } catch (error) {
      console.error('削除失敗:', error);
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    }
  };

  const startEdit = (schedule: Schedule) => {
    setEditingId(schedule.id);
    setEditTitle(schedule.title);
    setEditDate(schedule.date || '');
    setEditTime(schedule.time || '');
  };

  const handleUpdate = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      const scheduleRef = doc(db, 'schedules', id);
      const updatedFields = { title: editTitle, date: editDate || null, time: editTime || null };
      await updateDoc(scheduleRef, updatedFields);
      setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedFields } : s)));
      setEditingId(null);
      setMessages((prev) => [...prev, { role: 'assistant', text: 'かしこまりました。ご予定を更新いたしました。' }]);
    } catch (error) {
      console.error('更新失敗:', error);
    }
  };

  return (
    // 🌟 変更：全体を囲むコンテナに overflow-hidden を追加して画面全体のスクロールをガード
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100 font-sans relative pb-16 lg:pb-0 overflow-hidden">
      
      {/* 削除確認ポップアップ */}
      <DeleteModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => { setIsDeleteModalOpen(false); setDeleteTargetId(null); }} 
        onConfirm={executeDelete} 
      />

      {/* 🌟 変更：PCでの3カラムレイアウトのため、横幅の比率を調整（lg:w-2/5 = 40%） */}
      {/* チャットエリアのラッパー */}
      <div className={`w-full lg:w-2/5 h-full ${activeTab === 'chat' ? 'flex' : 'hidden lg:flex'} flex-col border-r border-gray-300`}>
        <ChatArea 
          messages={messages}
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          sendMessage={sendMessage}
          pendingDeleteSchedule={pendingDeleteSchedule}
          pendingUpdateSchedule={pendingUpdateSchedule}
          executeChatDelete={executeChatDelete}
          executeChatCancel={executeChatCancel}
          executeChatUpdate={executeChatUpdate}
          executeChatUpdateCancel={executeChatUpdateCancel}
        />
      </div>

      {/* 🌟 変更：PCでの3カラムレイアウトのため、横幅の比率を調整（lg:w-2/5 = 40%） */}
      {/* 予定リストエリアのラッパー */}
      <div className={`w-full lg:w-2/5 h-full ${activeTab === 'schedule' ? 'flex' : 'hidden lg:flex'} flex-col bg-gray-50 border-r border-gray-300`}>
        <ScheduleList 
          schedules={schedules}
          editingId={editingId}
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          editDate={editDate}
          setEditDate={setEditDate}
          editTime={editTime}
          setEditTime={setEditTime}
          startEdit={startEdit}
          cancelEdit={() => setEditingId(null)}
          handleUpdate={handleUpdate}
          onOpenDeleteModal={(id) => { setDeleteTargetId(id); setIsDeleteModalOpen(true); }}
        />
      </div>

      {/* 🌟 追加：設定エリアのラッパー（lg以上は3カラム目として右端に常時表示、未満は activeTab が 'settings' のときだけ表示、幅は lg:w-1/5 = 20%） */}
      <div className={`w-full lg:w-1/5 h-full ${activeTab === 'settings' ? 'flex' : 'hidden lg:flex'} flex-col bg-gray-50`}>
        <SettingsArea 
          userCallSign={userCallSign} 
          setUserCallSign={setUserCallSign} 
        />
      </div>

      {/* 下部タブバー（スマホ・タブレット用） */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex z-40 lg:hidden shadow-lg backdrop-blur-sm bg-white/95">
        <button 
          onClick={() => setActiveTab('chat')} 
          className={`flex-1 flex flex-row items-center justify-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'chat' ? 'text-gray-900 font-bold border-b-2 border-gray-800' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="text-xl">💬</span>
          <span className="text-sm md:text-base tracking-wide">執事チャット</span>
        </button>
        <button 
          onClick={() => setActiveTab('schedule')} 
          className={`flex-1 flex flex-row items-center justify-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'schedule' ? 'text-gray-900 font-bold border-b-2 border-gray-800' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="text-xl">📅</span>
          <span className="text-sm md:text-base tracking-wide">ご予定リスト</span>
        </button>
        {/* 🌟 追加：設定用のタブボタン */}
        <button 
          onClick={() => setActiveTab('settings')} 
          className={`flex-1 flex flex-row items-center justify-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'settings' ? 'text-gray-900 font-bold border-b-2 border-gray-800' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="text-xl">⚙️</span>
          <span className="text-sm md:text-base tracking-wide">設定</span>
        </button>
      </div>
      
    </div>
  );
}