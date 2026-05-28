import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// 設定したAPIキーを読み込む
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    // フロントエンド（画面）から送られてきたメッセージを受け取る
    const body = await req.json();
    const { message } = body;

    // モデルを指定
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      // AIに「執事」として振る舞い、JSONを作るよう指示
      systemInstruction: `あなたは有能で礼儀正しい執事です。ユーザーの入力から予定を抽出し、以下のJSON形式で出力してください。
      {
        "reply": "執事としての丁寧な返答メッセージ",
        "title": "予定のタイトル（予定がない・不明な場合はnull）",
        "date": "日付 YYYY-MM-DD形式（不明な場合はnull）",
        "time": "時間 HH:MM形式（不明な場合はnull）"
      }`
    });

    // AIにメッセージを送り、必ずJSON形式で返すように設定
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: message }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    // AIの返答（JSON形式の文字列）を受け取り、データに変換して画面側に返す
    const responseText = result.response.text();
    return NextResponse.json(JSON.parse(responseText));

  } catch (error) {
    console.error('AIエラー:', error);
    return NextResponse.json({ error: 'AIとの通信に失敗しました' }, { status: 500 });
  }
}