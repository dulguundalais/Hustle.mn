import Marketplace from "../../../components/marketplace";
export function generateStaticParams(){return ["explore","seller","service","buyer","seller-dashboard","orders","partner","admin","notifications","sharing"].map(section=>({section}));}
export default async function Page({params}:{params:Promise<{section:string}>}){const {section}=await params;return <Marketplace section={section}/>;}
