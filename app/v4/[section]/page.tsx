import V4 from "../../../components/v4-marketplace";
export function generateStaticParams(){return ["explore","service","seller","buyer","seller-dashboard","partner","admin"].map(section=>({section}));}
export default async function Page({params}:{params:Promise<{section:string}>}){const {section}=await params;return <V4 section={section}/>;}
