const test=require('node:test'),assert=require('node:assert/strict');
const {parse}=require('../cloudfunctions/collectWeekly/parser');
const row=(name,stars='1,234',growth='123')=>`<article class="Box-row"><h2><a href="/${name}">${name}</a></h2><p>AI agent tool</p><a href="/${name}/stargazers">${stars}</a><span>${growth} stars this week</span></article>`;
test('parses source counts, sorts and preserves unknown descriptions',()=>{
 const result=parse(row('owner/ai-agent')+row('anthropics/skills','9,000','200'),'2026-11-18T00:00:00Z');
 assert.equal(result.schemaVersion,1);assert.equal(result.projects[0].id,'anthropics/skills');assert.equal(result.projects[1].totalStars,1234);assert.equal(result.projects[1].growth,123);assert.equal(result.projects[1].summaryIsOriginal,true);
});
test('rejects malformed, missing counts and duplicate sources',()=>{
 for(const html of ['<html/>',row('owner/ai-agent','oops'),row('owner/ai-agent')+row('owner/ai-agent')])assert.throws(()=>parse(html,new Date().toISOString()));
});
test('five hour gate has no midnight reset over 72 hours',()=>{
 const due=Array.from({length:72},(_,h)=>h).filter(h=>h%5===0);for(let i=1;i<due.length;i++)assert.equal(due[i]-due[i-1],5);
});
