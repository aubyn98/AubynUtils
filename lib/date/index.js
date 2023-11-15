"use strict";Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"});function a(t){if(typeof t=="function")return t;if(typeof t!="string")throw new TypeError("formatter must be a string");return t==="date"?t="yyyy-MM-dd":t==="datetime"&&(t="yyyy-MM-dd HH:mm:ss"),r=>{const{yyyy:e,MM:n,dd:i,HH:l,mm:s,ss:y,ms:c}=r;return t.replaceAll("yyyy",e).replaceAll("MM",n).replaceAll("dd",i).replaceAll("HH",l).replaceAll("mm",s).replaceAll("ss",y).replaceAll("ms",c)}}function u(t=new Date,o="date",r=!0){(typeof t=="number"||typeof t=="string")&&(t=new Date(t)),o=a(o);const e={year:t.getFullYear(),month:t.getMonth()+1,date:t.getDate(),hour:t.getHours(),minute:t.getMinutes(),second:t.getSeconds(),millisecond:t.getMilliseconds()};e.yyyy=e.year.toString(),e.MM=e.month.toString(),e.dd=e.date.toString(),e.HH=e.hour.toString(),e.mm=e.minute.toString(),e.ss=e.second.toString(),e.ms=e.millisecond.toString();function n(i,l){e[i]=e[i].padStart(l,"0")}return r&&(n("yyyy",4),n("MM",2),n("dd",2),n("HH",2),n("mm",2),n("ss",2),n("ms",3)),o(e)}function g(t){return t.replace(/([0-9]{0,4})[^0-9]*([0-9]{0,2})[^0-9]*([0-9]{0,2}).*/,(o,r,e,n)=>{if(r=r.length==4?r+"-":r,e.length&&(e=e>12?"12":e==0?"01":e,e=e.padStart(2,"0")+"-"),n.length){const i=Number(r.slice(0,4)),l=Number(e.slice(0,2)),s=l==12?new Date(i+1,0,0).getDate():new Date(i,l,0).getDate();n=n.padStart(2,"0"),n=n>s?s.toString():n==0?"01":n}return r+e+n})}exports.dateFormat=g;exports.getDate=u;