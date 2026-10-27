// V52 — keep keyboard focus inside an open modal dialog (WCAG 2.4.3 / 2.1.2).
// Call from a keydown handler; returns true when it moved focus.
const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
export function focusableIn(root:ParentNode):HTMLElement[]{
 return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el=>el.getClientRects().length>0&&!el.closest('[hidden],[inert]'));
}
export function trapTab(event:{key:string;shiftKey:boolean;preventDefault():void},root:ParentNode|null,active:Element|null=typeof document==='undefined'?null:document.activeElement):boolean{
 if(event.key!=='Tab'||!root)return false;
 const list=focusableIn(root);
 if(!list.length){event.preventDefault();return true}
 const first=list[0],last=list[list.length-1];
 const inside=Boolean(active)&&typeof (root as Node).contains==='function'&&(root as Node).contains(active as Node);
 if(event.shiftKey&&(active===first||!inside)){event.preventDefault();last.focus();return true}
 if(!event.shiftKey&&(active===last||!inside)){event.preventDefault();first.focus();return true}
 return false;
}
