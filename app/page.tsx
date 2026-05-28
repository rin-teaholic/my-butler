'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Image from 'next/image';

type Message = { role: 'user' | 'assistant'; text: string };
type Schedule = { title: string; date: string | null; time: string | null };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 画面が最初に開かれた時に、データベースから予定を読み込む処理
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'schedules'));
        const loadedData = querySnapshot.docs.map((doc) => ({
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);

      if (data.title) {
        const newSchedule = { title: data.title, date: data.date, time: data.time };
        await addDoc(collection(db, 'schedules'), newSchedule);
        setSchedules((prev) => [...prev, newSchedule]);
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

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans relative">
      
      {/* 左側：チャットエリア（背景画像を指定） */}
      <div className="flex flex-col w-full md:w-2/3 h-1/2 md:h-full border-r border-gray-300 bg-white"
           style={{ backgroundImage: 'url(/mansion-bg.jpg)', backgroundSize: 'cover', overflow: 'hidden'}}>
        
        <div className="p-4 bg-gray-800 text-white font-bold text-center flex items-center justify-center gap-3">
          執事チャット
        </div>
        
        {/* 1つのスクロール領域（flex-1）の中に画像とメッセージを重ねて同居させ、下寄せ（justify-end）にします */}
        <div className="flex-1 p-4 overflow-y-auto z-10 relative bg-slate-50 bg-opacity-20 flex flex-col justify-end">
          
          {/* 執事のスプライト画像（背面） ※右寄せ */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <Image 
              src="/butler2.png" 
              alt="執事" 
              fill 
              className="object-contain object-right" 
            />
          </div>

          {/* チャットメッセージ（前面） ※上部1/4（頭）を避けるパディング pt-[25vh] と、右側の執事領域を避けるマージン pr-[100px] を追加 */}
          <div className="space-y-4 relative z-20 pt-[25vh] pr-[100px]">
            
            {/* 🌟 変更：メッセージが空の時、執事と同じデザインの左寄せの吹き出しを表示します */}
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[70%] p-3 rounded-lg shadow-md bg-white border border-gray-200 text-gray-800 rounded-bl-none">
                  ご用件をお申し付けくださいませ。
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-3 rounded-lg shadow-md ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white rounded-br-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
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

        </div> {/* スクロール領域（flex-1）の閉じ */}

        {/* チャット入力フォーム */}
        <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-2 relative z-30">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例：明日の15時に歯医者をメモして"
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

      </div> {/* 左側：チャットエリア全体の閉じ */}

      {/* 右側：予定リストエリア */}
      <div className="flex flex-col w-full md:w-1/3 h-1/2 md:h-full bg-gray-50">
        <div className="p-4 bg-gray-700 text-white font-bold text-center">
          ご予定リスト
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {schedules.length === 0 ? (
            <p className="text-center text-gray-400 mt-10">登録された予定はありません。</p>
          ) : (
            <ul className="space-y-3">
              {schedules.map((schedule, index) => (
                <li key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col">
                  <span className="font-bold text-gray-800 text-lg">{schedule.title}</span>
                  <div className="flex gap-2 text-sm text-gray-500 mt-1">
                    {schedule.date && <span>📅 {schedule.date}</span>}
                    {schedule.time && <span>⏰ {schedule.time}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
    </div>
  );
}