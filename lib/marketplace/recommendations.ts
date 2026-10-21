export type SellerReputation={
  review_count:number;
  average_rating:number|null;
  completed_orders:number;
};
export type RecommendableSeller=SellerReputation&{id:string;slug:string;display_name:string};

export function reputationScore(seller:SellerReputation):number{
 const count=Math.max(0,Number(seller.review_count)||0);
 const rating=Number(seller.average_rating);
 if(count===0||!Number.isFinite(rating)||rating<1||rating>5)return 0;
 // A Bayesian prior prevents one five-star beta review from outranking
 // a seller with a credible history of high-quality completed work.
 const prior=4.0,priorCount=5;
 const weighted=(count*rating+priorCount*prior)/(count+priorCount);
 const completionBonus=Math.min(0.12,Math.log1p(Math.max(0,seller.completed_orders||0))*0.035);
 return weighted+completionBonus;
}
export function orderRecommended<T extends RecommendableSeller>(sellers:T[]):T[]{
 return [...sellers].sort((a,b)=>{
  const sa=reputationScore(a),sb=reputationScore(b);
  if(Math.abs(sa-sb)>0.00001)return sb-sa;
  if((a.review_count||0)!==(b.review_count||0))return (b.review_count||0)-(a.review_count||0);
  // Stable deterministic fallback: never invent metrics for unrated sellers.
  return a.slug.localeCompare(b.slug);
 });
}
