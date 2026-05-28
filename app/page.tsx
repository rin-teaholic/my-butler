'use client';

import { useState } from 'react';

// メッセージと予定のデータ型（TypeScriptのルール）を定義
type Message = { role: 'user' | 'assistant'; text: string };
type Schedule = { title: string; date: string | null; time: string | null };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]); // チャット履歴
  const [input, setInput] = useState(''); // 入力中のテキスト
  const [schedules, setSchedules] = useState<Schedule[]>([]); // 予定リスト
  const [isLoading, setIsLoading] = useState(false); // AIの返答待ち状態

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    // 1. ユーザーの入力をチャット画面に追加
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      // 2. 裏側（API）にメッセージを送信
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      // 3. 執事（AI）の返答をチャット画面に追加
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);

      // 4. もし予定データが抽出されていれば、リストに追加
      if (data.title) {
        setSchedules((prev) => [
          ...prev,
          { title: data.title, date: data.date, time: data.time },
        ]);
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
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans">
      
      {/* 左側（スマホでは上）：チャットエリア */}
      <div className="flex flex-col w-full md:w-2/3 h-1/2 md:h-full border-r border-gray-300 bg-white">
        <div className="p-4 bg-gray-800 text-white font-bold text-center">
          執事チャット
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
          {messages.length === 0 && (
            <p className="text-center text-gray-400 mt-10">ご用件をお申し付けくださいませ。</p>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-lg ${
                msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 text-gray-500 p-3 rounded-lg rounded-bl-none shadow-sm animate-pulse">
                考え中...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-2">
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
      </div>

      {/* 右側（スマホでは下）：予定リストエリア */}
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