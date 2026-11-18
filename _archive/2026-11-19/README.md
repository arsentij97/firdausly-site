# Резервная копия боевой главной до сайта v9 (19.11.2026)

Вернуть прежнюю главную одним шагом (из корня репозитория):

```
cp site/_archive/2026-11-19/index.html site/index.html
cp site/_archive/2026-11-19/partners.html site/partners.html
cp site/_archive/2026-11-19/en/index.html site/en/index.html
cp site/_archive/2026-11-19/en/partners.html site/en/partners.html
sed -i '/<meta name="robots" content="noindex">/d' site/index.html site/partners.html site/en/index.html site/en/partners.html
node site/check.mjs && node site/build.mjs && (cd site/_deploy && git add -A && git commit -m "Вернули главную до v9" && git push)
```

Копии здесь помечены noindex, чтобы поисковики не видели дубль.
