import { redirect } from 'next/navigation';
import { getApprovedBetaUser } from '../../lib/auth/require-beta-user';

export const dynamic = 'force-dynamic';
export default async function BetaPage() {
  const user = await getApprovedBetaUser();
  if (!user) redirect('/login');
  return <main style={{maxWidth:800,margin:'6rem auto',padding:24}}>
    <h1>Hustle.mn Closed Beta</h1><p>Тавтай морил, {user.email}</p>
    <p>Энэ хэсэг зөвхөн зөвшөөрөгдсөн хэрэглэгчид нээлттэй.</p>
  </main>;
}
