export const emojiChoices = ['😀','😊','👍','👏','🎉','❤️','🙏','🔥','✨','✅','💼'] as const;
export const permittedFileTypes = ['image/jpeg','image/png','image/webp','application/pdf','text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'] as const;
export type MessengerAttachment = {id:string;message_id:string;sender_id:string;recipient_id:string;object_path:string;file_name:string;content_type:string;byte_size:number};
export type Presence = {user_id:string;share_activity:boolean;last_active_at:string};
export type ResponseStats={samples:number;average_minutes:number|null};
export function validateChatFile(file:{name:string;size:number;type:string}):string|null {
 if(!file.name||file.name.length>180)return 'Invalid filename';
 if(!permittedFileTypes.includes(file.type as typeof permittedFileTypes[number]))return 'Unsupported file type';
 if(file.size<1||file.size>10*1024*1024)return 'File must be between 1 byte and 10 MB';
 return null;
}
export function unreadCounts(messages:{sender_id:string;recipient_id:string;read_at?:string|null}[],uid:string):Record<string,number>{
 const result:Record<string,number>={};
 for(const m of messages)if(m.recipient_id===uid&&!m.read_at)result[m.sender_id]=(result[m.sender_id]||0)+1;
 return result;
}
export function activeWithinTwoMinutes(lastActive:string,now=Date.now()):boolean{
 const d=Date.parse(lastActive);return Number.isFinite(d)&&d<=now&&now-d<=120000;
}
export function lastSeenLabel(lastActive:string,en:boolean,now=Date.now()):string{
 const d=Date.parse(lastActive);if(!Number.isFinite(d)||d>now)return en?'Recently active':'Сүүлд идэвхтэй';
 const minutes=Math.floor((now-d)/60000);
 if(minutes<2)return en?'Online':'Онлайн';
 if(minutes<60)return en?`Active ${minutes} min ago`:`${minutes} минутын өмнө идэвхтэй`;
 const hours=Math.floor(minutes/60);return hours<24?(en?`Active ${hours}h ago`:`${hours} цагийн өмнө идэвхтэй`):(en?'Last active over a day ago':'Сүүлд нэг хоногоос өмнө идэвхтэй');
}
