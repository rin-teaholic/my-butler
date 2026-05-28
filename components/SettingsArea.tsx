'use client';

type SettingsAreaProps = {
  userCallSign: string;
  setUserCallSign: (value: string) => void;
};

export default function SettingsArea({ userCallSign, setUserCallSign }: SettingsAreaProps) {
  const suggestions = ["お嬢様", "旦那様", "坊ちゃま", "ご主人様", "奥様"];

  return (
    <div className="flex flex-col w-full h-full bg-gray-50 font-sans">
      <div className="p-4 bg-gray-600 text-white text-center font-butler text-base lg:text-lg tracking-wide">
        設定
      </div>
      
      <div className="flex-1 p-6 space-y-8 overflow-y-auto">
        {/* 呼び方の設定セクション */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-gray-500 tracking-widest uppercase">執事からの呼び方</h3>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <p className="text-xs text-gray-400">執事があなたに語りかける際の名称を設定します。</p>
            
            <input
              type="text"
              value={userCallSign}
              onChange={(e) => setUserCallSign(e.target.value)}
              placeholder="例：旦那様"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all font-butler"
            />

            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setUserCallSign(s)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all border ${
                    userCallSign === s 
                      ? 'bg-gray-800 text-white border-gray-800' 
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 今後の拡張用（プレースホルダー） */}
        <section className="space-y-4 opacity-50">
          <h3 className="text-sm font-bold text-gray-500 tracking-widest uppercase">その他の設定（準備中）</h3>
          <div className="bg-gray-100 p-4 rounded-2xl border border-dashed border-gray-300">
            <p className="text-xs text-gray-400 text-center py-4">
              執事の性格設定、通知設定、背景の切り替え機能などを準備中でございます。
            </p>
          </div>
        </section>
      </div>

      <div className="p-6 text-center">
        <p className="text-[10px] text-gray-300">わたしの執事 v1.0.0</p>
      </div>
    </div>
  );
}