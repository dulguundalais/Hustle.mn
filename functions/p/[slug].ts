import {publicProfile,type PublicEnv} from '../../lib/marketplace/public-profile';
export function onRequestGet({request,params,env}:{request:Request;params:{slug:string};env:PublicEnv}){return publicProfile(request,params.slug,env)}
