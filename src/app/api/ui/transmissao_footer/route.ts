import { NextResponse } from 'next/server';
import { createClientFromHeaders } from '@/lib/supabase/middleware';

export async function GET() {
  try {
    const supabase = createClientFromHeaders(new Headers());
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('tipo', 'transmissao')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    return NextResponse.json({ data: data?.[0] || null });
  } catch (err) {
    console.error('GET /api/ui/transmissao_footer error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}