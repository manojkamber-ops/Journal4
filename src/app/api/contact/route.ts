import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(4000),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please fill in all fields correctly.' }, { status: 400 });
    }
    const saved = await db.contactMessage.create({ data: parsed.data });
    return NextResponse.json({ ok: true, id: saved.id });
  } catch (e) {
    console.error('contact error', e);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
