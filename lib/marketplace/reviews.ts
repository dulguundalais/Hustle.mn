export type VerifiedReview={order_id:string;buyer_id:string;seller_id:string;service_id:string;rating:number;body:string;created_at:string};
export function reviewError(code:string|undefined,en:boolean):string|null{
 if(code==='23505')return en?'This order has already been reviewed.':'Энэ захиалгад аль хэдийн үнэлгээ өгсөн байна.';
 if(code==='23514')return en?'Rating must be 1–5 stars and review text 10–2,000 characters.':'1–5 од сонгож, 10–2000 тэмдэгттэй үнэлгээ бичнэ үү.';
 if(code==='42501')return en?'Only the buyer of a completed order can publish a review.':'Зөвхөн дууссан захиалгын Захиалагч үнэлгээ нийтлэх боломжтой.';
 return null;
}
