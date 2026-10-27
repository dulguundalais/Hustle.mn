// Presentation only: never use translated labels in database writes or URLs.
export function roleLabel(value:string,en:boolean):string{
 return en?value:({member:'Гишүүн',partner:'Түнш',admin:'Админ'} as Record<string,string>)[value]||value;
}
export function projectStatusLabel(value:string,en:boolean):string{
 return en?value:({open:'Санал авч байна',pending:'Хүлээгдэж байна',invited:'Урилга илгээсэн',viewed:'Үзсэн',submitted:'Санал илгээсэн',awarded:'Захиалга үүссэн',accepted:'Зөвшөөрсөн',declined:'Татгалзсан',rejected:'Татгалзсан',withdrawn:'Буцаан татсан',cancelled:'Цуцлагдсан'} as Record<string,string>)[value]||value;
}
export function auditLabel(value:string,en:boolean):string{
 return en?value:({profiles:'Профайл',services:'Үйлчилгээ',orders:'Захиалга',referrals:'Урилгын бүртгэл',business_rules:'Бизнесийн дүрэм',beta_allowlist:'Хэрэглэгчийн эрх',message_reports:'Чатын гомдол',INSERT:'Нэмсэн',UPDATE:'Шинэчилсэн',DELETE:'Устгасан',insert:'Нэмсэн',update:'Шинэчилсэн',delete:'Устгасан'} as Record<string,string>)[value]||value;
}
