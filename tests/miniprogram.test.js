const test=require('node:test');const assert=require('node:assert/strict');
const snapshot=require('../data/weekly.json');const config=require('../miniprogram/config');
let store={},requestCount=0,fail=false;
global.wx={getStorageSync:k=>store[k],setStorageSync:(k,v)=>{store[k]=v;},request:o=>{requestCount++;setImmediate(()=>fail?o.fail(Error('offline')):o.success({statusCode:200,data:snapshot}));}};
const service=require('../miniprogram/services/weekly');
test('cache, request deduplication, invalid payload, offline retention and rollback',async()=>{
 assert.equal(service.initial().origin,'随包快照');
 config.transport='https';
 config.apiUrl='https://weekly.example.test/v1/weekly';
 const a=service.fetchLatest(),b=service.fetchLatest();assert.equal(a,b);await a;assert.equal(requestCount,1);
 assert.equal(service.initial().origin,'设备缓存');
 fail=true;await assert.rejects(service.fetchLatest());assert.deepEqual(service.initial().snapshot,snapshot);fail=false;
 assert.throws(()=>service.validate({...snapshot,projects:[{...snapshot.projects[0],url:'https://evil.test'}]}));
 assert.throws(()=>service.validate({...snapshot,projects:[snapshot.projects[0],snapshot.projects[0]]}));
 store['ai-weekly-snapshot-v1']={...snapshot,updatedAt:new Date().toISOString()};await assert.rejects(service.fetchLatest(),/较旧/);
});
test('page refresh preserves favorites, recomputes categories and copies correct repository',async()=>{
 let page;global.Page=p=>{page=p;};require('../miniprogram/pages/index/index');
 page.setData=function(d){Object.assign(this.data,d);};page.data.saved=[snapshot.projects[0].id];
 page.applySnapshot(snapshot,'设备缓存');assert.equal(page.data.total,snapshot.projects.length);
 page.data.tab='收藏';page.refresh();assert.equal(page.data.projects.length,1);
 let copied;wx.setClipboardData=o=>{copied=o.data;};page.copy({currentTarget:{dataset:{id:snapshot.projects[0].id}}});assert.equal(copied,snapshot.projects[0].url);
 page.applySnapshot({...snapshot,projects:[{...snapshot.projects[0],rank:99}]},'云端榜单');assert.equal(page.data.projects[0].saved,true);
});

test('cloud transport uses configured environment and validates result',async()=>{
 store={};config.transport='cloud';let called;
 wx.cloud={callFunction:o=>{called=o;o.success({result:snapshot});}};
 await service.fetchLatest();assert.equal(called.config.env,config.cloudEnv);assert.equal(called.name,'weekly');assert.deepEqual(called.data,{});
 wx.cloud.callFunction=o=>o.success({result:{error:'snapshot_unavailable'}});
 await assert.rejects(service.fetchLatest());assert.deepEqual(service.initial().snapshot,snapshot);
});
