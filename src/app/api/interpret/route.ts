import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize client only when API key is available
const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: NextRequest) {
  try {
    if (!client) {
      throw new Error('OpenAI API key is not configured');
    }

    const { chart } = await req.json();
    if (!chart) throw new Error('chart is required');

    const system = `Ты — доброжелательный астролог-редактор. Коротко и по делу, без фатализма.
Дай: 1) тему по Большой тройке, 2) 5–7 пунктов по планетам в домах, 3) 3 практичных совета.`;

    const resp = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        { role:'system', content: system },
        { role:'user', content: 'JSON натальной карты:\n' + JSON.stringify(chart) }
      ]
    });
    const text = resp.choices[0]?.message?.content ?? '';
    return NextResponse.json({ ok:true, text });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'OpenAI error';
    return NextResponse.json({ ok:false, error }, { status:400 });
  }
}