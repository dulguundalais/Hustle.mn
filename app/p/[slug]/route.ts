import {publicProfile} from '../../../lib/marketplace/public-profile';
export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}){const {slug}=await params;return publicProfile(request,slug,{NEXT_PUBLIC_SUPABASE_URL:process.env.NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY})}
