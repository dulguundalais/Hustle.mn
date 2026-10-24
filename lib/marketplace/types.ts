export type Profile={id:string;display_name:string;headline:string;bio:string;skills?:string|null;is_seller:boolean;slug:string|null;public_profile:boolean;avatar_path?:string|null};
export type Listing={id:string;seller_id:string;title:string;title_en:string;description:string;category:string;price:number;delivery_days:number;revisions:number;package_name:string;status:string};
export type Order={id:string;buyer_id:string;seller_id:string;service_id:string;service_title:string;quoted_price:number;brief:string;status:string;delivery_note:string;created_at:string;package_name:string;delivery_days:number;revision_limit:number;revisions_used:number;revision_note:string};
export type Portfolio={id:string;seller_id:string;title:string;object_path:string;url?:string};
export type Referral={id:string;partner_id:string;referred_id:string;status:string;created_at:string;eligible_until:string};
export type Rules={id:boolean;commission_percent:number;partner_percent:number;active_partner_percent:number;attribution_days:number;reward_months:number};
export type BetaMember={email:string;role:string;enabled:boolean};
export const categories=[['design','Дизайн','Design'],['ui','UI/UX','UI/UX'],['video','Видео','Video'],['translation','Орчуулга','Translation'],['marketing','Маркетинг','Marketing'],['web','Веб & IT','Web & IT'],['interior','Интерьер','Interior'],['ai','AI бүтээл','AI creation'],['proposals','Төсөл','Proposals']];
