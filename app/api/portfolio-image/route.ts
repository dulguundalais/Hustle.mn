import {portfolioImage} from '../../../lib/marketplace/public-profile';
export function GET(request:Request){return portfolioImage(request,{NEXT_PUBLIC_SUPABASE_URL:process.env.NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY})}
