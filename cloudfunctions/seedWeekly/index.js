// Administrative bootstrap only. Disable mini-program invocation in console.
const cloud=require('wx-server-sdk');
const snapshot=require('./snapshot.json');
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV});
exports.main=async()=>{
 const context=cloud.getWXContext();
 // Trusted SDK context, never event fields. Client invocation must not write.
 if(context.OPENID || context.FROM_OPENID) throw Error('ADMIN_ONLY');
 const doc=cloud.database().collection('weekly_public').doc('latest');
 let existing;
 try{existing=await doc.get();}catch(error){
  if(!/not exist|not found|不存在/i.test(String(error.errMsg||error.message||''))) throw error;
 }
 if(existing && existing.data && existing.data.snapshot &&
    Date.parse(existing.data.snapshot.updatedAt)>=Date.parse(snapshot.updatedAt)){
  return {status:'kept_existing',updatedAt:existing.data.snapshot.updatedAt};
 }
 if(snapshot.schemaVersion!==1 || !snapshot.projects.length) throw Error('INVALID_SNAPSHOT');
 await doc.set({data:{snapshot}});
 return {status:'seeded',projects:snapshot.projects.length,updatedAt:snapshot.updatedAt};
};
