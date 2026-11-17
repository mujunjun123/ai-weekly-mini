const cloud=require('wx-server-sdk');
const https=require('https');
const {parse,URL}=require('./parser');
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV});
function download(){return new Promise((resolve,reject)=>{
 const request=https.get(URL,{headers:{'User-Agent':'AIWeeklyMini/1.0','Accept':'text/html','Accept-Encoding':'identity'}},response=>{
  if(response.statusCode!==200){response.resume();return reject(Error('SOURCE_HTTP_'+response.statusCode));}
  let size=0;const chunks=[];
  response.on('data',chunk=>{size+=chunk.length;if(size>3000000)response.destroy(Error('SOURCE_TOO_LARGE'));else chunks.push(chunk);});
  response.on('end',()=>resolve(Buffer.concat(chunks).toString('utf8')));response.on('error',reject);
 });
 request.setTimeout(15000,()=>request.destroy(Error('SOURCE_TIMEOUT')));request.on('error',reject);
});}
exports.main=async(event={})=>{
 const context=cloud.getWXContext();if(context.OPENID||context.FROM_OPENID)throw Error('ADMIN_ONLY');
 const start=Date.now(),hour=Math.floor(start/3600000);
 // Hourly trigger with an epoch-based gate: exactly 5 hours across midnight.
 // A daily */5 hour cron would instead have a 4-hour midnight gap.
 if(event.Type==='Timer' && hour%5!==0)return {status:'skipped_not_due'};
 const db=cloud.database();
 const snapshot=parse(await download(),new Date(start).toISOString());
 const result=await db.runTransaction(async transaction=>{
  const doc=transaction.collection('weekly_public').doc('latest');
  let existing;try{existing=await doc.get();}catch(e){if(!/not exist|not found|不存在/i.test(String(e.errMsg||e.message||'')))throw e;}
  const current=existing&&existing.data&&existing.data.snapshot;
  if(current&&Date.parse(current.updatedAt)>=start)return {status:'kept_newer'};
  if(event.Type==='Timer'&&current&&Math.floor(Date.parse(current.updatedAt)/3600000)===hour)return {status:'skipped_duplicate'};
  await doc.set({data:{snapshot}});
  return {status:'updated',updatedAt:snapshot.updatedAt,projects:snapshot.projects.length};
 });
 console.log(JSON.stringify(result));return result;
};
