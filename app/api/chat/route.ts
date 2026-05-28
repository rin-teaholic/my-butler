import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message } = body;

        const model = genAI.getGenerativeModel({
            model: 'gemini-3.5-flash',
            systemInstruction: `あなたは有能で礼儀正しい執事です。ユーザーの入力から予定の登録・削除の意図を抽出し、以下のJSON形式で出力してください。
      {
        "reply": "通常の会話、または予定登録時の丁寧な返答メッセージ。予定削除の指示の場合は、このフィールドは空文字（\"\"）にしてください。",
        "action": "予定を登録・メモする場合は'create'、予定を削除・キャンセルする場合は'delete'、通常の会話や不明な場合は'none'",
        "title": "登録する予定のタイトル（actionが'create'の場合のみ。それ以外はnull）",
        "date": "登録する日付 YYYY-MM-DD形式（actionが'create'の場合のみ。それ以外はnull）",
        "time": "登録する時間 HH:MM形式（actionが'create'の場合のみ。それ以外はnull）",
        "targetTitle": "削除・キャンセルしたい予定のタイトル（actionが'delete'の場合のみ。それ以外はnull）"
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