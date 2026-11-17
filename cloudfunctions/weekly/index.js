// No event fields control collection, document ID, URL, or writes.
const cloud=require('wx-server-sdk');
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV});
exports.main=async()=>{
 try {
  const {data}=await cloud.database().collection('weekly_public').doc('latest').get();
  const snapshot=data.snapshot;
  if(!snapshot || snapshot.schemaVersion!==1 || !Array.isArray(snapshot.projects) || !snapshot.projects.length) return {error:'snapshot_unavailable'};
  return snapshot;
 } catch (_) {return {error:'snapshot_unavailable'};}
};
