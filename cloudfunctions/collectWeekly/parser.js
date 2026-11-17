const cheerio=require('cheerio');
const {colors,labels,summaries}=require('./editorial.json');
const URL='https://github.com/trending?since=weekly';
function parse(raw,updatedAt){
 const $=cheerio.load(raw),rows=$('article.Box-row'),seen=new Set(),projects=[];
 if(!rows.length)throw Error('TRENDING_STRUCTURE_CHANGED');
 rows.each((i,el)=>{
  const row=$(el),path=row.find('h2 a').attr('href')||'';
  if(!/^\/[\w.-]+\/[\w.-]+$/.test(path)||seen.has(path))throw Error('INVALID_REPOSITORY');seen.add(path);
  const name=path.slice(1),desc=row.find('p').first().text().trim(),stars=row.find('a[href$="/stargazers"]').first().text().trim().replace(/,/g,''),growth=row.find('span').toArray().map(node=>$(node).text()).join(' ').match(/([\d,]+)\s+stars? this week/);
  if(!/^\d+$/.test(stars)||!growth)throw Error('MISSING_STAR_COUNTS');
  const totalStars=Number(stars),weekly=Number(growth[1].replace(/,/g,''));
  if(!Number.isSafeInteger(totalStars)||!Number.isSafeInteger(weekly))throw Error('INVALID_STAR_COUNTS');
  const text=name+' '+desc;
  if(!/\b(ai|llm|agents?|claude|codex|gpt|skills|mcp|machine.learning|deep.learning)\b/i.test(text))return;
  const rules=[['逆向',/reverse.engineer|逆向/i],['安全审计',/security|vulnerabilit|bug.hunt/i],['代码审查',/code.review/i],['设计',/design.system|ui.ux/i],['技能框架',/\bskills?\b/i],['流程编排',/orchestrat|workflow/i],['自动化',/automation/i],['界面',/webui|user.interface/i],['框架',/framework/i],['Agent',/\bagents?\b/i]];
  const match=rules.find(([,pattern])=>pattern.test(text)),category=labels[name.toLowerCase()]||(match?match[0]:'AI工具');
  projects.push({id:name,name,url:'https://github.com'+path,desc,summary:summaries[name.toLowerCase()]||desc,summaryIsOriginal:!summaries[name.toLowerCase()],category,color:colors[category],totalStars,stars:totalStars.toLocaleString('en-US'),growth:weekly,sourceRank:i+1});
 });
 if(!projects.length)throw Error('NO_AI_PROJECTS');
 projects.sort((a,b)=>b.growth-a.growth);projects.forEach((p,i)=>p.rank=i+1);
 return {schemaVersion:1,updatedAt,source:URL,period:'GitHub 本周（来源口径）',scope:'GitHub Trending 官方周榜中的 AI 相关项目，按本周新增 Star 排序；关键词筛选，不代表全站排名。',projects};
}
module.exports={parse,URL};
