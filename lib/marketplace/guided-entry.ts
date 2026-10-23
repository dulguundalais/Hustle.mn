import type {Audience} from './solution-finder';

export type GuidedGoalKey='growth'|'automation'|'web'|'content'|'brand'|'analytics'|'design'|'skills'|'personal-it'|'video'|'writing'|'other';
export type GuidedGoal={key:GuidedGoalKey;mn:string;en:string;exampleMn:string;exampleEn:string;};
export const guidedGoals:Record<Audience,GuidedGoal[]>={
 business:[
  {key:'growth',mn:'Борлуулалт, захиалга өсгөх',en:'Grow sales & bookings',exampleMn:'Манай бизнесийн борлуулалт, захиалгыг нэмэгдүүлэх хэрэгтэй байна',exampleEn:'Our business needs more sales and bookings'},
  {key:'automation',mn:'AI & процесс автоматжуулах',en:'AI & workflow automation',exampleMn:'Манай байгууллагын давтагддаг ажлыг автоматжуулах хэрэгтэй байна',exampleEn:'We need to automate repetitive business workflows'},
  {key:'web',mn:'Вебсайт, онлайн бизнес',en:'Websites & online business',exampleMn:'Манай байгууллагад орчин үеийн вебсайт, онлайн үйлчилгээ хэрэгтэй байна',exampleEn:'Our business needs a modern website and online services'},
  {key:'content',mn:'Маркетинг, контент',en:'Marketing & content',exampleMn:'Манай бизнесийн сошиал контент болон маркетингийг сайжруулах хэрэгтэй',exampleEn:'We need better social content and marketing'},
  {key:'brand',mn:'Брэнд хөгжүүлэх',en:'Build our brand',exampleMn:'Манай байгууллагад шинэ брэнд, лого дизайн хэрэгтэй байна',exampleEn:'Our company needs better branding and logo design'},
  {key:'analytics',mn:'Тайлан, дата шинжилгээ',en:'Analytics & reporting',exampleMn:'Бидэнд борлуулалтын тайлан, dashboard болон өгөгдлийн шинжилгээ хэрэгтэй',exampleEn:'We need a sales dashboard and analytics reporting'}
 ],
 personal:[
  {key:'design',mn:'Дизайн, лого',en:'Design & logo',exampleMn:'Надад лого дизайн хийлгэх хэрэгтэй байна',exampleEn:'I need professional logo and design work'},
  {key:'web',mn:'Вебсайт, IT тусламж',en:'Websites & IT help',exampleMn:'Надад хувийн вебсайт хийх мэргэжилтэн хэрэгтэй байна',exampleEn:'I need someone to build my personal website'},
  {key:'video',mn:'Видео, Reels эвлүүлэг',en:'Video & Reels',exampleMn:'Надад богино видео, Reels контент хийлгэх хэрэгтэй байна',exampleEn:'I need short-form video and Reels editing'},
  {key:'content',mn:'Контент, сошиал',en:'Content & social',exampleMn:'Надад сошиал контент бэлдэх мэргэжилтэн хэрэгтэй байна',exampleEn:'I need a freelancer to make social content'},
  {key:'skills',mn:'AI болон автоматжуулалт',en:'AI & automation',exampleMn:'Би өөрийн өдөр тутмын ажлыг AI ашиглан автоматжуулахыг хүсэж байна',exampleEn:'I want to automate daily tasks using AI'},
  {key:'other',mn:'Бусад хувийн төсөл',en:'Something else',exampleMn:'Надад хувийн төслийг хэрэгжүүлэх мэргэжилтэн хэрэгтэй байна',exampleEn:'I need a freelancer for my personal project'}
 ]
};
export const guidedIndustries=[
 {value:'',mn:'Сонгох шаардлагагүй',en:'Optional'},
 {value:'restaurant',mn:'Ресторан, хоол үйлчилгээ',en:'Restaurants & food'},
 {value:'retail',mn:'Худалдаа, онлайн дэлгүүр',en:'Retail & e-commerce'},
 {value:'services',mn:'Үйлчилгээний бизнес',en:'Services'},
 {value:'technology',mn:'IT, технологи',en:'Technology'},
 {value:'other',mn:'Бусад салбар',en:'Other'}
] as const;
export function guidedProblem(goal:GuidedGoal,notes:string,en:boolean):string{
 const trimmed=notes.trim().replace(/\s+/g,' ').slice(0,1200);
 return trimmed.length>=5?trimmed:(en?goal.exampleEn:goal.exampleMn);
}
export function guidedFinderHref(audience:Audience,goal:GuidedGoal,notes:string,en:boolean,budget='',timeline=''):string{
 const params=new URLSearchParams({audience,q:guidedProblem(goal,notes,en)});
 if(budget.trim())params.set('budget',budget.trim().slice(0,80));
 if(timeline.trim())params.set('timeline',timeline.trim().slice(0,80));
 return '/solutions/?'+params.toString();
}
