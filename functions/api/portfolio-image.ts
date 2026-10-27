import {portfolioImage,type PublicEnv} from '../../lib/marketplace/public-profile';
export function onRequestGet({request,env}:{request:Request;env:PublicEnv}){return portfolioImage(request,env)}
