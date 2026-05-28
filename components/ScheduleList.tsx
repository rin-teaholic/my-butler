'use client';

type Schedule = { id: string; title: string; date: string | null; time: string | null };

type ScheduleListProps = {
  schedules: Schedule[];
  editingId: string | null;
  editTitle: string;
  setEditTitle: (value: string) => void;
  editDate: string;
  setEditDate: (value: string) => void;
  editTime: string;
  setEditTime: (value: string) => void;
  startEdit: (schedule: Schedule) => void;
  cancelEdit: () => void;
  handleUpdate: (id: string) => void;
  onOpenDeleteModal: (id: string) => void;
};

export default function ScheduleList({
  schedules,
  editingId,
  editTitle,
  setEditTitle,
  editDate,
  setEditDate,
  editTime,
  setEditTime,
  startEdit,
  cancelEdit,
  handleUpdate,
  onOpenDeleteModal,
}: ScheduleListProps) {
  return (
    <div className="flex flex-col w-full h-full bg-gray-50">
      <div className="p-4 bg-gray-700 text-white text-center font-butler">ご予定リスト</div>
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
                      <button onClick={cancelEdit} className="text-gray-500 px-3 py-1 rounded text-xs">キャンセル</button>
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
                      <button onClick={() => onOpenDeleteModal(schedule.id)} className="text-gray-500 hover:text-red-600 p-1.5 rounded">🗑️</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}