'use client';

type DeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteModal({ isOpen, onClose, onConfirm }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 text-gray-900 border border-gray-100">
        <h3 className="text-lg font-bold mb-2 text-gray-800">🗑️ ご予定の削除</h3>
        <p className="text-gray-600 text-sm mb-6">このご予定を削除してもよろしいですか？</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-full"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-full shadow-md"
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}