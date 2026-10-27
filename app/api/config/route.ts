import {NextResponse} from 'next/server';
export function GET(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return NextResponse.json(url&&key?{url,key}:{error:'Beta configuration unavailable'},{status:url&&key?200:503,headers:{'Cache-Control':'no-store'}})}
