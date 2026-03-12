import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, method, headers, payload } = body;

    if (!url || !method) {
      return NextResponse.json({ error: 'Missing url or method' }, { status: 400 });
    }

    const fetchOptions: RequestInit = {
      method,
      headers: headers || {},
    };

    if (method !== 'GET' && payload) {
      fetchOptions.body = payload;
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
