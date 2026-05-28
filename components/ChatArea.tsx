'use client';

import Image from 'next/image';
import { FormEvent, useState, useEffect } from 'react'; // 🌟 useState と useEffect を追加

type Message = { role: 'user' | 'assistant'; text: string; isDeleteConfirm?: boolean; isUpdateConfirm?: boolean };

type ChatAreaProps = {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  sendMessage: (e: FormEvent) => void;
  pendingDeleteSchedule: any;
  pendingUpdateSchedule: any;
  executeChatDelete: (target: any) => void;
  executeChatCancel: () => void;
  executeChatUpdate: (target: any) => void;
  executeChatUpdateCancel: () => void;
};

export default function ChatArea({
  messages,
  input,
  setInput,
  isLoading,
  sendMessage,
  pendingDeleteSchedule,
  pendingUpdateSchedule,
  executeChatDelete,
  executeChatCancel,
  executeChatUpdate,
  executeChatUpdateCancel,
}: ChatAreaProps) {
  // 🌟 追加：画面幅に応じて表示件数を変えるためのステート（初期値はPC用の5件）
  const [displayCount, setDisplayCount] = useState(5);

  // 🌟 追加：画面の横幅を監視して、表示件数をリアルタイムに切り替える処理
  useEffect(() => {
    const handleResize = () => {
      // 親玉ファイル（page.tsx）と合わせて 1024px を境界線にします
      if (window.innerWidth < 1024) {
        setDisplayCount(3); // スマホ・タブレット縦なら3件
      } else {
        setDisplayCount(5); // PC大画面なら5件
      }
    };

    handleResize(); // 画面が開いた瞬間に一度チェック
    window.addEventListener('resize', handleResize); // 画面サイズ変更を監視
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col w-full h-full bg-white"
      style={{ backgroundImage: 'url(/mansion-bg.jpg)', backgroundSize: 'cover', overflow: 'hidden' }}>

      <div className="p-4 bg-gray-800 text-white font-bold text-center flex items-center justify-center gap-3">
        わたしの執事
      </div>

      <div className="flex-1 p-4 overflow-y-auto z-10 relative bg-slate-50 bg-opacity-20 flex flex-col justify-end">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image src="/butler2.png" alt="執id" fill className="object-contain object-right" />
        </div>

        <div className="space-y-4 relative z-20 pt-[25vh] pr-12 lg:pr-[100px]">
          {messages.length === 0 && (
            <div className="flex justify-start">
              <div className="max-w-[85%] p-3 rounded-lg shadow-md bg-white border border-gray-200 text-gray-800 text-sm lg:text-base rounded-bl-none">
                ご用件をお申し付けくださいませ。
              </div>
            </div>
          )}

          {/* 🌟 変更：.slice(-5) だった部分を、変化する .slice(-displayCount) に変更 */}
          {messages.slice(-displayCount).map((msg, index, arr) => (
            <div key={index} className="flex flex-col space-y-2">
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg shadow-md text-sm lg:text-base ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                  }`}>
                  {msg.text}
                </div>
              </div>

              {/* 削除確認時のボタン */}
              {msg.isDeleteConfirm && pendingDeleteSchedule && index === arr.length - 1 && (
                <div className="flex justify-start gap-2 pl-2 animate-fade-in">
                  <button onClick={() => executeChatDelete(pendingDeleteSchedule)} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md">👍 はい（削除する）</button>
                  <button onClick={executeChatCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-4 py-2 rounded-full shadow-md">🙅 いいえ（やめる）</button>
                </div>
              )}

              {/* 変更確認時のボタン */}
              {msg.isUpdateConfirm && pendingUpdateSchedule && index === arr.length - 1 && (
                <div className="flex justify-start gap-2 pl-2 animate-fade-in">
                  <button onClick={() => executeChatUpdate(pendingUpdateSchedule)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md">👍 はい（変更する）</button>
                  <button onClick={executeChatUpdateCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-4 py-2 rounded-full shadow-md">🙅 いいえ（やめる）</button>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 text-gray-500 p-3 rounded-lg rounded-bl-none shadow-md animate-pulse text-sm lg:text-base">考え中...</div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-2 relative z-30">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={pendingDeleteSchedule || pendingUpdateSchedule ? "「はい」か「いいえ」でお答えください" : "例：明日の15時に歯医者をメモして"}
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm lg:text-base text-gray-900 bg-white focus:outline-none focus:border-blue-500"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()} className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-full font-bold text-sm lg:text-base disabled:bg-gray-400">送信</button>
      </form>
    </div>
  );
}