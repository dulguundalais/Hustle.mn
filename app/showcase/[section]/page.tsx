import LegacyRedirect from '../../../components/legacy-redirect';
export const metadata={robots:{index:false,follow:false}};
export function generateStaticParams(){return ["explore","seller","service","buyer","seller-dashboard","orders","partner","admin","notifications","sharing"].map(section=>({section}))}
export default function Page(){return <LegacyRedirect to="/explore/"/>}
