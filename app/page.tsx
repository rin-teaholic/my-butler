'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Image from 'next/image';

// 🌟 Message型を拡張して、削除確認ボタンを表示するためのフラグ（isDeleteConfirm）を持たせます
type Message = { role: 'user' | 'assistant'; text: string; isDeleteConfirm?: boolean };
type Schedule = { id: string; title: string; date: string | null; time: string | null };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 削除確認ポップアップ（カードのゴミ箱用）のステート
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // 編集モード用のステート
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  // 🌟 追加：チャット経由の削除で「いま確認待ち状態かどうか」を記憶するステート
  const [pendingDeleteSchedule, setPendingDeleteSchedule] = useState<{ id: string; title: string } | null>(null);

  // 画面が最初に開かれた時に、データベースから予定を読み込む処理
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

  // 🌟 追加：実際にチャット経由で削除を実行する共通の関数
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
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: '申し訳ございません。ご予定の削除に失敗いたしました。' }
      ]);
    } finally {
      setPendingDeleteSchedule(null);
      setIsLoading(false);
    }
  };

  // 🌟 追加：チャット経由の削除をキャンセルする共通の関数
  const executeChatCancel = () => {
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', text: 'かしこまりました。削除を取り消しました。何か他のご用件はございますか？' }
    ]);
    setPendingDeleteSchedule(null);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');

    // 🌟 変更：もし「削除確認待ち」の状態でユーザーがメッセージを送ってきた場合の処理
    if (pendingDeleteSchedule) {
      if (userMessage === 'はい' || userMessage === 'イエス' || userMessage === 'yes' || userMessage === 'お願いします') {
        await executeChatDelete(pendingDeleteSchedule);
      } else if (userMessage === 'いいえ' || userMessage === 'ノー' || userMessage === 'no' || userMessage === 'やめます') {
        executeChatCancel();
      } else {
        // 「はい」「いいえ」以外を言われたら、もう一度確認を促す
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: `申し訳ございません。「${pendingDeleteSchedule.title}」のご予定を削除してよろしいですか？「はい」か「いいえ」でお答えくださいませ。`, isDeleteConfirm: true }
        ]);
      }
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      // 🌟 変更：AIが「削除したい」と判断（action === 'delete'）した場合の処理
      if (data.action === 'delete' && data.targetTitle) {
        // 現在の予定リストから、AIが指定したタイトルが含まれる予定を探す（部分一致）
        const matchedSchedule = schedules.find(s => s.title.includes(data.targetTitle) || data.targetTitle.includes(s.title));
        
        if (matchedSchedule) {
          // マッチする予定があれば確認待ちステートに入れる
          setPendingDeleteSchedule({ id: matchedSchedule.id, title: matchedSchedule.title });
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', text: `「${matchedSchedule.title}」のご予定を削除します。よろしいですか？`, isDeleteConfirm: true }
          ]);
        } else {
          // 見つからなかった場合
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', text: `申し訳ございません。該当する「${data.targetTitle}」というご予定が見つかりませんでした。` }
          ]);
        }
      } else {
        // 通常の会話、または予定の追加
        setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);

        if (data.title && data.action === 'create') {
          const newScheduleData = { title: data.title, date: data.date, time: data.time };
          const docRef = await addDoc(collection(db, 'schedules'), newScheduleData);

          setSchedules((prev) => [
            ...prev,
            { id: docRef.id, ...newScheduleData },
          ]);
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: '申し訳ございません。システムエラーが発生いたしました。' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // カードのゴミ箱ボタンからモーダルで削除するときの関数
  const executeDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteDoc(doc(db, 'schedules', deleteTargetId));
      setSchedules((prev) => prev.filter((s) => s.id !== deleteTargetId));
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'かしこまりました。ご予定を削除いたしました。' }
      ]);
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
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'かしこまりました。ご予定を更新いたしました。' }
      ]);
    } catch (error) {
      console.error('更新失敗:', error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans relative">
      
      {/* 削除確認ポップアップ（カード用） */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 text-gray-900 border border-gray-100">
            <h3 className="text-lg font-bold mb-2 text-gray-800">🗑️ ご予定の削除</h3>
            <p className="text-gray-600 text-sm mb-6">このご予定を削除してもよろしいですか？</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setIsDeleteModalOpen(false); setDeleteTargetId(null); }} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-full">キャンセル</button>
              <button onClick={executeDelete} className="px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-full shadow-md">削除する</button>
            </div>
          </div>
        </div>
      )}

      {/* 左側：チャットエリア */}
      <div className="flex flex-col w-full md:w-2/3 h-1/2 md:h-full border-r border-gray-300 bg-white"
           style={{ backgroundImage: 'url(/mansion-bg.jpg)', backgroundSize: 'cover', overflow: 'hidden'}}>
        
        <div className="p-4 bg-gray-800 text-white font-bold text-center flex items-center justify-center gap-3">
          執事チャット
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto z-10 relative bg-slate-50 bg-opacity-20 flex flex-col justify-end">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <Image src="/butler2.png" alt="執事" fill className="object-contain object-right" />
          </div>

          <div className="space-y-4 relative z-20 pt-[25vh] pr-[100px]">
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[70%] p-3 rounded-lg shadow-md bg-white border border-gray-200 text-gray-800 rounded-bl-none">
                  ご用件をお申し付けくださいませ。
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div key={index} className="flex flex-col space-y-2">
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-lg shadow-md ${
                    msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
                
                {/* 🌟 変更：削除確認フラグがある場合、吹き出しのすぐ下にYes/Noボタンを表示します */}
                {msg.isDeleteConfirm && pendingDeleteSchedule && index === messages.length - 1 && (
                  <div className="flex justify-start gap-2 pl-2 animate-fade-in">
                    <button
                      onClick={() => executeChatDelete(pendingDeleteSchedule)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md transition-colors"
                    >
                      👍 はい（削除する）
                    </button>
                    <button
                      onClick={executeChatCancel}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-4 py-2 rounded-full shadow-md transition-colors"
                    >
                      🙅 いいえ（やめる）
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-500 p-3 rounded-lg rounded-bl-none shadow-md animate-pulse">
                  考え中...
                </div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-2 relative z-30">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={pendingDeleteSchedule ? "「はい」か「いいえ」でお答えください" : "例：明日の15時に歯医者をメモして"}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-gray-900 bg-white focus:outline-none focus:border-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-full font-bold transition-colors disabled:bg-gray-400"
          >
            送信
          </button>
        </form>
      </div>

      {/* 右側：予定リストエリア */}
      <div className="flex flex-col w-full md:w-1/3 h-1/2 md:h-full bg-gray-50">
        <div className="p-4 bg-gray-700 text-white font-bold text-center">ご予定リスト</div>
        <div className="flex-1 p-4 overflow-y-auto">
          {schedules.length === 0 ? (
            <p className="text-center text-gray-400 mt-10">登録された予定はありません。</p>
          ) : (
            <ul className="space-y-3">
              {schedules.map((schedule) => (
                <li key={schedule.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between items-stretch gap-2">
                  {editingId === schedule.id ? (
                    <div className="flex flex-col gap-2 w-full text-gray-900">
                      <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm bg-white font-bold w-full" />
                      <div className="flex gap-2">
                        <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm bg-white flex-1" />
                        <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm bg-white flex-1" />
                      </div>
                      <div className="flex justify-end gap-2 mt-1">
                        <button onClick={() => setEditingId(null)} className="text-gray-500 px-3 py-1 rounded text-xs">キャンセル</button>
                        <button onClick={() => handleUpdate(schedule.id)} className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold shadow-sm">保存</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start gap-2 w-full">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 text-lg">{schedule.title}</span>
                        <div className="flex gap-2 text-sm text-gray-500 mt-1">
                          {schedule.date && <span>📅 {schedule.date}</span>}
                          {schedule.time && <span>⏰ {schedule.time}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => startEdit(schedule)} className="text-gray-500 hover:text-blue-600 p-1.5 rounded">✏️</button>
                        <button onClick={() => { setDeleteTargetId(schedule.id); setIsDeleteModalOpen(true); }} className="text-gray-500 hover:text-red-600 p-1.5 rounded">🗑️</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
    </div>
  );
}