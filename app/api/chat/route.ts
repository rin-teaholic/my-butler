import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // 🌟 変更：フロントの設定画面から送られてくる userCallSign（呼び方）を受け取ります
        const { message, userCallSign } = body;

        const model = genAI.getGenerativeModel({
            model: 'gemini-3.5-flash',
            // 🌟 変更：指示書の中に「userCallSignで呼ぶこと」と「update（変更）」のルールを追加
            systemInstruction: `あなたは有能で礼儀正しい執事です。
                返答（reply）の際には、ユーザーのことを必ず「${userCallSign || '旦那様'}」と呼び、非常に丁寧で気品のある言葉遣い（〜でございます、〜でしょうか）を徹底してください。
                ユーザーの入力から予定の登録・削除・変更の意図を抽出し、以下のJSON形式で出力してください。
                {
                    "reply": "通常の会話、または予定登録・変更時の丁寧な返答メッセージ。予定削除の指示の場合は、このフィールドは空文字（\"\"）にしてください。",
                    "action": "予定を登録・メモする場合は'create'、予定を削除・キャンセルする場合は'delete'、予定を変更・修正・アップデートする場合は'update'、通常の会話や不明な場合は'none'",
                    "title": "新規登録、または変更後の予定のタイトル（actionが'create'または'update'の場合。それ以外はnull）",
                    "date": "新規登録、または変更後の日付 YYYY-MM-DD形式（actionが'create'または'update'の場合。それ以外はnull）",
                    "time": "新規登録、または変更後の時間 HH:MM形式（actionが'create'または'update'の場合。それ意味はnull）",
                    "targetTitle": "削除、または変更したい『対象』の予定のタイトル（actionが'delete'または'update'の場合のみ。それ以外はnull）"
                }`
        });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: message }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const responseText = result.response.text();
        return NextResponse.json(JSON.parse(responseText));

    } catch (error: any) {
        console.error('AIエラー:', error);

        // 429（クォータ制限）のエラーを検知して、フロントに429ステータスをそのまま返す
        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
            return NextResponse.json({ error: 'QUOTA_EXCEEDED' }, { status: 429 });
        }

        return NextResponse.json({ error: 'AIとの通信に失敗しました' }, { status: 500 });
    }
}