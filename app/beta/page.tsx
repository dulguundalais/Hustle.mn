import { redirect } from 'next/navigation';
import { getApprovedBetaUser } from '../../lib/auth/require-beta-user';
import BetaWelcome from '../../components/beta-welcome';

export const dynamic = 'force-dynamic';
export default async function BetaPage() {
  const user = await getApprovedBetaUser();
  if (!user) redirect('/login');
  return <BetaWelcome email={user.email}/>;
}
