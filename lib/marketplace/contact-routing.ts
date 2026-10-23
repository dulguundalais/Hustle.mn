import type {Profile} from './types';

// The public catalog only links to sellers that opted into discovery.
// Keep navigation checks separate from UI state so first-time buyers,
// self-contact and missing seller profiles are handled distinctly.
export type SellerContactResult =
 | {kind:'none'|'invalid'|'unavailable'|'self'}
 | {kind:'onboarding'|'ready';sellerId:string};

const sellerSlugPattern=/^[a-z0-9][a-z0-9-]{2,59}$/;

export function resolveSellerContact(
 slug:string|null,
 currentUserId:string,
 hasBuyerProfile:boolean,
 profiles:Pick<Profile,'id'|'slug'|'is_seller'|'public_profile'>[]
):SellerContactResult{
 if(!slug)return {kind:'none'};
 if(!sellerSlugPattern.test(slug))return {kind:'invalid'};
 const selected=profiles.find(profile=>
   profile.slug===slug && profile.is_seller && profile.public_profile
 );
 if(!selected)return {kind:'unavailable'};
 if(selected.id===currentUserId)return {kind:'self'};
 if(!hasBuyerProfile)return {kind:'onboarding',sellerId:selected.id};
 return {kind:'ready',sellerId:selected.id};
}
