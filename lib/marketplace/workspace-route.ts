// V49 — one place that decides which dashboard a signed-in person lands in.
// Pages: /buyer/ (buyer), /seller-studio/ (seller), /admin/ (admin) render their own
// dashboard; /login/ is a neutral door that forwards to one of them.
export type Workspace='buyer'|'seller'|'admin';
export const workspacePath:Record<Workspace,string>={buyer:'/buyer/',seller:'/seller-studio/',admin:'/admin/'};
export const WORKSPACE_KEY='hustle-workspace';

export type RouteInput={
  entry:Workspace;          // dashboard the current page renders
  login:boolean;            // true on the neutral /login/ door
  asked:string|null;        // ?mode= from the link the person followed
  buyerIntent:boolean;      // contacting a seller or ordering a service
  role:string;              // beta_allowlist role ('' when unknown)
  isSeller:boolean;         // profile.is_seller
  last:string|null;         // workspace remembered from the previous visit
};

/** Where a signed-in person should be. Pure, so it can be unit tested. */
export function chooseWorkspace(i:RouteInput):Workspace{
  // A specific dashboard URL is an explicit choice; never second-guess it.
  if(!i.login)return i.entry==='buyer'&&i.asked==='seller'?'seller':i.entry;
  // Following a seller or a service means the person is here to buy.
  if(i.buyerIntent)return 'buyer';
  if(i.asked==='seller')return 'seller';
  if(i.asked==='admin')return 'admin';
  // Otherwise return to the dashboard used last time, if it is still allowed.
  if(i.last==='admin'&&i.role==='admin')return 'admin';
  if(i.last==='seller'&&i.isSeller)return 'seller';
  if(i.last==='buyer')return 'buyer';
  if(i.role==='admin')return 'admin';
  if(i.isSeller)return 'seller';
  return 'buyer';
}

/** Only remember a dashboard the person is actually allowed to use. */
export function rememberableWorkspace(entry:Workspace,role:string,isSeller:boolean):Workspace|null{
  if(entry==='admin')return role==='admin'?'admin':null;
  if(entry==='seller')return isSeller?'seller':null;
  return 'buyer';
}
