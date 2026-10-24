// Curated tools: display-only labels/icons, never employment or certification claims.
// Keys persisted by seller in public.seller_tools, not inferred from their bio.
export type CreativeTool={key:string;name:string;mark:string;icon:'figma'|'image'|'pen'|'video'|'palette'|'box'|'code'|'react'|'database'|'table'|'chart'|'bot'|'notebook'|'audio'|'camera'|'layers'|'file';category:'design'|'development'|'media'|'productivity'};
export const CREATIVE_TOOLS:readonly CreativeTool[]=[
 {key:'figma',name:'Figma',mark:'◈',icon:'figma',category:'design'},
 {key:'photoshop',name:'Adobe Photoshop',mark:'Ps',icon:'image',category:'design'},
 {key:'illustrator',name:'Adobe Illustrator',mark:'Ai',icon:'pen',category:'design'},
 {key:'canva',name:'Canva',mark:'C',icon:'palette',category:'design'},
 {key:'autocad',name:'AutoCAD',mark:'A',icon:'layers',category:'design'},
 {key:'blender',name:'Blender',mark:'B',icon:'box',category:'design'},
 {key:'after-effects',name:'After Effects',mark:'Ae',icon:'video',category:'media'},
 {key:'premiere-pro',name:'Premiere Pro',mark:'Pr',icon:'video',category:'media'},
 {key:'capcut',name:'CapCut',mark:'Cc',icon:'video',category:'media'},
 {key:'davinci-resolve',name:'DaVinci Resolve',mark:'Da',icon:'camera',category:'media'},
 {key:'audition',name:'Adobe Audition',mark:'Au',icon:'audio',category:'media'},
 {key:'vscode',name:'VS Code',mark:'</>',icon:'code',category:'development'},
 {key:'react',name:'React',mark:'⚛',icon:'react',category:'development'},
 {key:'nextjs',name:'Next.js',mark:'N',icon:'code',category:'development'},
 {key:'python',name:'Python',mark:'Py',icon:'code',category:'development'},
 {key:'supabase',name:'Supabase',mark:'S',icon:'database',category:'development'},
 {key:'wordpress',name:'WordPress',mark:'W',icon:'file',category:'development'},
 {key:'excel',name:'Microsoft Excel',mark:'X',icon:'table',category:'productivity'},
 {key:'powerbi',name:'Power BI',mark:'P',icon:'chart',category:'productivity'},
 {key:'notion',name:'Notion',mark:'N',icon:'notebook',category:'productivity'},
 {key:'chatgpt',name:'ChatGPT',mark:'✳',icon:'bot',category:'productivity'},
 {key:'google-workspace',name:'Google Workspace',mark:'G',icon:'file',category:'productivity'}
];
export const CREATIVE_TOOL_MAX=16;
export const creativeToolFor=(key:string)=>CREATIVE_TOOLS.find(t=>t.key===key);
// Only curated, self-hosted software logos are served; never use a seller-controlled URL.
export const brandLogoFor=(key:string):string|undefined=>creativeToolFor(key)?'/tool-logos/'+key+'.svg':undefined;
export const CATEGORY_LABELS={design:['Дизайн & 3D','Design & 3D'],development:['Хөгжүүлэлт','Development'],media:['Видео & аудио','Video & audio'],productivity:['Бизнес & AI','Business & AI']} as const;
