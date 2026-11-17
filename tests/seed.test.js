const test=require('node:test');const assert=require('node:assert/strict');const Module=require('node:module');
test('admin seed rejects clients, preserves newer data, and writes fixed snapshot',async()=>{
 let context={OPENID:'user'},writes=0,current,err;
 const doc={get:async()=>{if(err)throw err;return current;},set:async o=>{writes++;assert.ok(o.data.snapshot.projects.length);}};
 const cloud={DYNAMIC_CURRENT_ENV:'env',init:()=>{},getWXContext:()=>context,database:()=>({collection:n=>{assert.equal(n,'weekly_public');return {doc:id=>{assert.equal(id,'latest');return doc;}};}})};
 const original=Module._load;let seed;
 try{Module._load=function(name,...args){return name==='wx-server-sdk'?cloud:original.call(this,name,...args);};seed=require('../cloudfunctions/seedWeekly').main;}finally{Module._load=original;}
 await assert.rejects(seed(),/ADMIN_ONLY/);assert.equal(writes,0);
 context={};current={data:{snapshot:{updatedAt:'2099-01-01T00:00:00Z'}}};assert.equal((await seed()).status,'kept_existing');assert.equal(writes,0);
 current=null;err=Error('permission denied');await assert.rejects(seed(),/permission/);assert.equal(writes,0);
 err=Error('document does not exist');assert.equal((await seed()).status,'seeded');assert.equal(writes,1);
});
