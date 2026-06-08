# Client Report Format

Use this for owner/client reports.

## Structure

1. Итоги периода.
2. Расход.
3. Лиды / заявки / продажи.
4. CPA / CPL / CPO.
5. Доход / ROAS / ДРР, if available.
6. Что улучшилось.
7. Что ухудшилось.
8. Что сделали.
9. Что планируем.
10. Риски.
11. Следующие шаги.

## Tone

- concise;
- business-oriented;
- no technical noise unless relevant;
- no unsupported claims;
- no guaranteed results.

## Required Caveats

If primary leads are zero:

`CPA cannot be calculated because explicit conversion goal reaches = 0.`

If CRM is absent:

`Sales quality and revenue conclusions require CRM or manual lead review.`

If Direct conversions differ from Metrika goals:

`Direct conversions are not treated as lead truth.`

If Direct Leads API cannot resolve page / landing ID:

`Direct API lead retrieval is unavailable for the current landing path; do not treat this as no leads. Use explicit Metrika conversion goals as lead truth and mark lead-based conclusions as requiring human review.`

If click goals are present:

`Click goals are diagnostic interactions, not leads and not CPA.`
