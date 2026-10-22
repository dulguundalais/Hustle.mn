/**
 * Hustle Smart Finder v1: transparent, rule-based intent routing.
 * NO generative model is connected in this release. Recommendations are
 * solution templates, real matches only come from marketplace_catalog RPC.
 * This deliberately works if the optional live backend is temporarily down.
 */
export type Audience='personal'|'business';
export type OutcomeKey='growth'|'content'|'automation'|'website'|'brand'|'analytics'|'general';
export type Solution={
 id:string;mn:string;en:string;whyMn:string;whyEn:string;categories:string[];
};
export type Outcome={key:OutcomeKey;mn:string;en:string;mnWhy:string;enWhy:string;solutions:Solution[]};
export type PublishedMatch={id:string;category:string;title:string;title_en?:string;description:string;display_name:string;slug:string;price:number;packages?:{tier:string;price:number}[]};
const solutions:Record<OutcomeKey,Outcome>={
 growth:{key:'growth',mn:'Борлуулалт ба захиалга нэмэгдүүлэх',en:'Grow sales and bookings',mnWhy:'Харилцагч татах суваг, контент, захиалгын урсгалыг хамтад нь үнэлээрэй.',enWhy:'Consider customer acquisition, content and the booking journey together.',solutions:[
 {id:'ads',mn:'Meta Ads ба дижитал маркетинг',en:'Meta Ads & digital marketing',whyMn:'Танай зорилтот хэрэглэгчид хүрэх кампанит ажил.',whyEn:'Campaigns to reach likely customers.',categories:['marketing']},
 {id:'content',mn:'Фото, Reels ба контент үйлдвэрлэл',en:'Photo, Reels & content creation',whyMn:'Үйлчилгээгээ ойлгомжтой, сонирхол татахуйц харуулах.',whyEn:'Help customers see and understand what you offer.',categories:['video','design','ai']},
 {id:'booking',mn:'Захиалгын систем ба автоматжуулалт',en:'Booking tools & automation',whyMn:'Хүсэлт алдахгүй хүлээн авч, үр дүнг хэмжих.',whyEn:'Capture inquiries and measure results.',categories:['web','ai']}
 ]},
 content:{key:'content',mn:'Контент ба сурталчилгаа хөгжүүлэх',en:'Improve content and promotion',mnWhy:'Агуулгын зорилго, сувгаа эхэлж тодорхойлбол илүү үр дүнтэй.',enWhy:'Start with clear audiences and content goals.',solutions:[
 {id:'reels',mn:'Reels, видео үйлдвэрлэл',en:'Reels & video production',whyMn:'Тогтмол чанартай богино видео.',whyEn:'Consistent quality short-form video.',categories:['video','ai']},
 {id:'social',mn:'Сошиал контентын төлөвлөгөө',en:'Social content plan',whyMn:'Нэг удаагийн пост биш, зорилготой цуврал контент.',whyEn:'An intentional series instead of one-off posts.',categories:['marketing','translation']},
 {id:'creative',mn:'AI-assisted бүтээлч контент',en:'AI-assisted creative assets',whyMn:'Хүний хяналттай үйлдвэрлэлийг илүү хурдан болгох.',whyEn:'Speed production with human quality control.',categories:['ai','design']}
 ]},
 automation:{key:'automation',mn:'Ажлын процессыг автоматжуулах',en:'Automate manual work',mnWhy:'Эхлээд давтагддаг ажлаа тодорхойлж, хэрэгсэл болон өгөгдлийн хамгаалалтаа сонгоорой.',enWhy:'Map the repetitive task, integrations and data safeguards first.',solutions:[
 {id:'workflow',mn:'Workflow automation (n8n / Make)',en:'Workflow automation (n8n / Make)',whyMn:'Гар ажиллагаатай давтагддаг алхмуудыг нэгтгэх.',whyEn:'Connect repetitive steps and systems.',categories:['ai','web']},
 {id:'bot',mn:'AI chatbot ба CRM холболт',en:'AI chatbot & CRM integration',whyMn:'Хүсэлт хүлээн авах, ангилах, хариу өгөхөд туслах.',whyEn:'Support intake, categorization and replies.',categories:['ai','web']},
 {id:'dashboard',mn:'Автомат тайлан ба аналитик',en:'Automated reports & analytics',whyMn:'Гүйцэтгэлийн мэдээллийг тогтмол нэгтгэх.',whyEn:'Bring performance data together on schedule.',categories:['web','proposals']}
 ]},
 website:{key:'website',mn:'Цахим үйлчилгээ ба веб хөгжүүлэлт',en:'Build digital experiences',mnWhy:'Зорилго, шаардлагатай функц, арчлалтын хэрэгцээг хамтад нь тодорхойл.',enWhy:'Define goals, required features and ongoing maintenance.',solutions:[
 {id:'site',mn:'Бизнесийн вебсайт / landing page',en:'Business website / landing page',whyMn:'Үйлчилгээ, үнэ, холбогдох сувгийг ил тод болгох.',whyEn:'Show offerings, pricing and next steps.',categories:['web']},
 {id:'ui',mn:'UI/UX дизайн ба хэрэглэгчийн урсгал',en:'UI/UX design & journeys',whyMn:'Хэрэглэгчийн үйлдлийг энгийн, ойлгомжтой болгох.',whyEn:'Make interactions clearer and easier.',categories:['ui']},
 {id:'maint',mn:'Веб арчилгаа ба интеграц',en:'Site care & integrations',whyMn:'Нийтлэсний дараа найдвартай ажиллуулах.',whyEn:'Keep things reliable after launch.',categories:['web','ai']}
 ]},
 brand:{key:'brand',mn:'Брэнд ба харагдах байдал',en:'Improve brand identity',mnWhy:'Зорилтот хэрэглэгч болон брэндийн гол ялгарал дээрээ тулгуурлан бүтээ.',enWhy:'Anchor your creative work in your audience and positioning.',solutions:[
 {id:'identity',mn:'Лого ба брэндийн систем',en:'Logo & brand system',whyMn:'Нэг мөр харагдах дүр төрх.',whyEn:'Create a consistent identity.',categories:['design']},
 {id:'visual',mn:'Маркетингийн визуал контент',en:'Marketing visuals',whyMn:'Нэг загварын хэлээр харилцах.',whyEn:'Keep campaign visuals consistent.',categories:['design','video']},
 {id:'brandweb',mn:'Брэндэд тохирсон веб хуудас',en:'Brand-led website',whyMn:'Онлайнаар итгэл төрүүлэх.',whyEn:'Build trust online.',categories:['web','ui']}
 ]},
 analytics:{key:'analytics',mn:'Өгөгдөл ба тайлангаа сайжруулах',en:'Make better use of data',mnWhy:'Хэмжих үзүүлэлтээ шийдэх асуудалтайгаа холбож сонго.',enWhy:'Choose metrics around the decisions you need to make.',solutions:[
 {id:'report',mn:'Борлуулалтын dashboard',en:'Sales dashboard',whyMn:'Хамгийн чухал KPI-уудаа нэг газраас харах.',whyEn:'Bring your most important KPIs together.',categories:['web','proposals']},
 {id:'integrate',mn:'Өгөгдөл цэвэрлэх ба нэгтгэх',en:'Data cleanup & integrations',whyMn:'Тархай өгөгдлийг найдвартай болгох.',whyEn:'Make fragmented data reliable.',categories:['web','ai']},
 {id:'insights',mn:'Бизнесийн шинжилгээ',en:'Business analysis',whyMn:'Үр дүнгээсээ дараагийн шийдвэрээ гаргах.',whyEn:'Turn performance into better decisions.',categories:['proposals','marketing']}
 ]},
 general:{key:'general',mn:'Төслийн хэрэгцээг тодорхойлох',en:'Define the project',mnWhy:'Зорилго, одоогийн нөхцөл, хүсэж буй үр дүнгээ тайлбарлахад хангалттай.',enWhy:'Describe your goal, current situation and intended result.',solutions:[
 {id:'consult',mn:'Төслийн зөвлөгөө ба төлөвлөлт',en:'Project planning',whyMn:'Төслийн эхний шаардлагыг тодорхойлох.',whyEn:'Clarify project requirements.',categories:['proposals']},
 {id:'design',mn:'Дизайн ба дижитал шийдэл',en:'Design & digital delivery',whyMn:'Ямар төрлийн шийдэл хэрэгтэйг харьцуулах.',whyEn:'Explore possible delivery approaches.',categories:['design','web']},
 {id:'market',mn:'Маркетинг ба контент',en:'Marketing & content',whyMn:'Хэрэглэгчид хүрэх арга барилаа сонгох.',whyEn:'Choose ways to reach your audience.',categories:['marketing','video']}
 ]}
};
const keywords:Record<Exclude<OutcomeKey,'general'>,RegExp>={
 automation:/автомат|automati|automation|automat|n8n|make.com|zapier|chatbot|бот|bot|crm|integrat|давтаг|гараар|систем холб|ajil hɵngɵ|ajil hongol|ai agent/i,
 growth:/борлуул|захиалга.*(бага|нэм|олон)|захиалг.*өс|үйлчлүүлэгч|орлого нэм|sales|growth|revenue|customer|booking.*(more|increase)|zahialga|borluulalt|ads|хэрэглэгч.*тат/i,
 content:/reels|рийл|рилс|контент|content|видео|video|зураг.*пост|social|сошиал|пост|post|tiktok|instagram/i,
 website:/website|вэб|веб|web|сайт|site|ecommerce|онлайн дэлгүүр|landing|app|апп/i,
 brand:/лого|logo|брэнд|brand|танигдах|design|дизайн|identity/i,
 analytics:/тайлан|report|dashboard|аналитик|analyt|өгөгдөл|data|kpi|excel|sheet/i
};
export const problemExamples=[
 {key:'growth' as const,mn:'Борлуулалт, захиалгаа нэмэгдүүлэх',en:'Grow sales and bookings',exampleMn:'Манай рестораны захиалга бага байна',exampleEn:'We want more restaurant bookings'},
 {key:'automation' as const,mn:'Давтагддаг ажлаа автоматжуулах',en:'Automate routine work',exampleMn:'Facebook захиалгыг автоматаар бүртгэмээр байна',exampleEn:'Automate incoming Facebook orders'},
 {key:'content' as const,mn:'Контент ба сошиалаа хөгжүүлэх',en:'Improve social content',exampleMn:'Дэлгүүртээ Reels хийлгэмээр байна',exampleEn:'I need better Reels for my store'},
 {key:'website' as const,mn:'Вебсайт, онлайн үйлчилгээ эхлүүлэх',en:'Launch a digital product',exampleMn:'Манай компанид вэбсайт хэрэгтэй',exampleEn:'Our company needs a website'}
];
export function classifyNeed(input:string):Outcome{
 const clean=input.trim().slice(0,1200);
 if(!clean)return solutions.general;
 const scores=Object.entries(keywords).map(([key,rx])=>({key:key as Exclude<OutcomeKey,'general'>,score:(clean.match(new RegExp(rx.source,'gi'))||[]).length}));
 scores.sort((a,b)=>b.score-a.score);
 return scores[0]?.score>0?solutions[scores[0].key]:solutions.general;
}
export function matchingPublished(services:PublishedMatch[],solution:Solution,limit=3):PublishedMatch[]{
 // The source list must be the published opt-in catalog returned by RPC.
 return services.filter(s=>solution.categories.includes(s.category)).slice(0,limit);
}
export function buildProjectBrief(input:string,audience:Audience,language:'mn'|'en',budget?:string,timeline?:string):string{
 const goal=input.trim().replace(/\s+/g,' ').slice(0,1200);
 const outcome=classifyNeed(goal);
 const ideas=outcome.solutions.map(x=>language==='mn'?x.mn:x.en).join(', ');
 if(language==='en')return ['PROJECT BRIEF','Context: '+(audience==='business'?'Business':'Personal'),'Goal: '+(goal||'To be confirmed'),'Possible approaches (to discuss): '+ideas,'Budget: '+(budget?.trim()||'To be discussed'),'Timeline: '+(timeline?.trim()||'To be discussed'),'Deliverables, access permissions and success criteria: To be agreed with the freelancer.'].join('\n');
 return ['ТӨСЛИЙН ХҮСЭЛТ','Хэрэглэгч: '+(audience==='business'?'Байгууллага / бизнес':'Хувь хүн'),'Зорилго: '+(goal||'Тодруулах'),'Ярилцах боломжтой шийдлүүд: '+ideas,'Төсөв: '+(budget?.trim()||'Тохиролцоно'),'Хугацаа: '+(timeline?.trim()||'Тохиролцоно'),'Хүлээлгэн өгөх үр дүн, өгөгдөлд хандах эрх ба амжилтын хэмжүүрийг freelancer-тэй тохиролцоно.'].join('\n');
}
