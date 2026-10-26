'use client';
import {useEffect} from 'react';

/** V50: retired pages forward to the current route, keeping the query string. */
export default function LegacyRedirect({to}:{to:string}){
 useEffect(()=>{window.location.replace(to+window.location.search+window.location.hash)},[to]);
 return <main style={{minHeight:'60vh',display:'grid',placeItems:'center',fontFamily:'Manrope,Arial,sans-serif'}}>
  <p>Шилжиж байна… <a href={to}>Hustle.mn</a></p>
 </main>;
}
