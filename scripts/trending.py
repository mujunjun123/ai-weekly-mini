"""Parse official Trending rows independently of fetching and editorial summaries.
Design reference: huchenme/github-trending-api, src/functions/utils/fetch.js.
This is an independent Python implementation using the current GitHub markup.
"""
import re
from bs4 import BeautifulSoup

def parse_weekly(raw):
    rows = BeautifulSoup(raw, 'html.parser').select('article.Box-row')
    if not rows:
        raise ValueError('GitHub 周榜为空或页面结构已变化')
    records = []
    seen = set()
    for source_rank, row in enumerate(rows, 1):
        link = row.select_one('h2 a')
        path = link.get('href', '') if link else ''
        if not re.fullmatch(r'/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', path):
            raise ValueError('仓库链接无效，拒绝发布不完整榜单')
        full_name = path.lstrip('/')
        if full_name in seen:
            raise ValueError('仓库重复，拒绝发布榜单')
        seen.add(full_name)
        star = row.select_one('a[href$="/stargazers"]')
        growth = re.search(r'([\d,]+)\s+stars? this week', row.get_text(' ', strip=True))
        if star is None or growth is None:
            raise ValueError('缺少总 Star 或周增 Star，拒绝使用零值替代')
        total_text = star.get_text(strip=True).replace(',', '')
        if not total_text.isdigit():
            raise ValueError('总 Star 不是有效整数')
        description = row.select_one('p')
        language = row.select_one('[itemprop="programmingLanguage"]')
        author, name = full_name.split('/')
        records.append({
            'id': full_name, 'name': full_name, 'author': author, 'repoName': name,
            'url': 'https://github.com' + path,
            'desc': description.get_text(' ', strip=True) if description else '',
            'language': language.get_text(strip=True) if language else None,
            'sourceRank': source_rank,
            'totalStars': int(total_text),
            'currentPeriodStars': int(growth[1].replace(',', '')),
        })
    return records
