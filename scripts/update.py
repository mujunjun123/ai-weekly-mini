from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
from trending import parse_weekly
import json,re,subprocess,hashlib,os,tempfile,fcntl,time
from contextlib import contextmanager
from labels import classify,summarize
ROOT=Path(__file__).resolve().parents[1]
URL='https://github.com/trending?since=weekly'
def atomic(path,text):
 fd,tmp=tempfile.mkstemp(dir=path.parent)
 with os.fdopen(fd,'w') as f:f.write(text)
 os.replace(tmp,path)
@contextmanager
def update_lock():
 (ROOT/'data').mkdir(exist_ok=True)
 with (ROOT/'data/.update.lock').open('w') as lock:
  fcntl.flock(lock,fcntl.LOCK_EX | fcntl.LOCK_NB)
  yield

def update():
 with update_lock():
  return _update()

def _update():
 raw=subprocess.check_output(['curl','-sSL','--fail','--retry','2','--retry-max-time','90','--max-time','40',URL])
 projects=[]
 for record in parse_weekly(raw):
  name,desc=record['name'],record['desc']
  if not re.search(r'\b(ai|llm|agents?|claude|codex|gpt|skills|mcp|machine.learning|deep.learning)\b',name+' '+desc,re.I):continue
  category,color=classify(name,desc)
  projects.append(dict(record,summary=summarize(name,desc),category=category,color=color,growth=record['currentPeriodStars'],stars=f"{record['totalStars']:,}"))
 if not projects:raise ValueError('未取得 AI 项目，保留旧数据')
 projects.sort(key=lambda p:p['growth'],reverse=True)
 for i,p in enumerate(projects):p['rank']=i+1
 now=datetime.now(ZoneInfo('Asia/Shanghai')).isoformat(timespec='seconds')
 result=dict(schemaVersion=1,updatedAt=now,source=URL,scope='GitHub Trending 官方周榜中的 AI 相关项目，按本周新增 Star 排序；关键词筛选，不代表全站排名。',period='GitHub 本周（来源口径）',projects=projects,sourceSha256=hashlib.sha256(raw).hexdigest())
 snapshots=ROOT/'data/snapshots'
 snapshots.mkdir(exist_ok=True)
 atomic(snapshots/(str(time.time_ns())+'.json'),json.dumps(result,ensure_ascii=False))
 # Publish one canonical complete snapshot; failed fetch/parse never reaches here.

 atomic(ROOT/'data/weekly.json',json.dumps(result,ensure_ascii=False,indent=2))
 atomic(ROOT/'miniprogram/utils/data.js','module.exports = '+json.dumps(projects,ensure_ascii=False)+';\n')
 atomic(ROOT/'miniprogram/utils/meta.js','module.exports = '+json.dumps({k:v for k,v in result.items() if k!='projects'},ensure_ascii=False)+';\n')
 atomic(ROOT/'preview/live-data.js','window.WEEKLY = '+json.dumps(result,ensure_ascii=False)+';\n')
 for path in snapshots.glob('*.json'):
  if path.stat().st_mtime < time.time()-7*86400:path.unlink()
 return result
if __name__=='__main__':
 r=update();print(json.dumps({'updatedAt':r['updatedAt'],'projects':len(r['projects']),'source':URL},ensure_ascii=False))
