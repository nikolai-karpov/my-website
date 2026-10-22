# Yandex API access (moved from root AGENTS.md)

Moved verbatim from root `AGENTS.md`. Root `AGENTS.md` only points here.

## Yandex API Access Patterns (lessons from 2026-07-27)

### Wordstat: use hermes-agent runtime, NOT curl

Wordstat tools (`yandex_wordstat_top` etc.) are Python functions in `/Users/nik/projects/hermes-agent/tools/yandex_wordstat_tool.py`. They are accessed through the hermes-agent runtime, NOT as curl endpoints.

**Correct pattern:**
```bash
set -a && source /Users/nik/projects/my-website/.env && set +a && python3 -c "
import sys, json, asyncio
sys.path.insert(0, '/Users/nik/projects/hermes-agent')
from tools.yandex_wordstat_tool import _handle_top

async def check(phrase):
    result = await _handle_top({
        'phrase': phrase,
        'regions': [...],
        'num_phrases': 5
    })
    d = json.loads(result)
    print(d['total_count'])

asyncio.run(check('тестовая фраза'))
"
```

**Wrong pattern (404 every time):**
```
curl -X POST https://searchapi.api.cloud.yandex.net/v2/wordstat/top
```

### Direct API: curl with Bearer token works

```
curl -H "Authorization: Bearer $YANDEX_DIRECT_TOKEN" \
     -H "Client-Login: befooz@yandex.ru" \
     https://api.direct.yandex.com/json/v5/...
```

### Metrika API: curl with OAuth token works

```
curl -H "Authorization: OAuth $YANDEX_METRIKA_TOKEN" \
     https://api-metrika.yandex.net/management/v1/...
```
