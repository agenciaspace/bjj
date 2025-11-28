# Translation Guidelines

## Always Use Portuguese

All user-facing text in the application **must be in Portuguese (pt-BR)**.

### ✅ DO:
- Use translation keys: `{t('admin.users')}`
- Add new translations to `src/locales/pt.json`
- Keep code variables/functions in English (it's the programming standard)

### ❌ DON'T:
- Hardcode English text in JSX: `<p>Members</p>`
- Mix languages in the same sentence
- Use informal/slang unless it's BJJ terminology

## Validation

Run the translation validator before committing:

```bash
node validate-translations.js
```

This will scan all `.tsx` and `.ts` files for hardcoded English text.

## Common Translations

| English | Portuguese |
|---------|-----------|
| Members | Membros |
| Users | Usuários |
| Academies | Academias |
| Search | Buscar |
| Refresh | Atualizar |
| Loading | Carregando |
| Total | Total |
| Owner | Proprietário |
| Student | Aluno |
| Active | Ativo |
| Pending | Pendente |

## BJJ-Specific Terms

These are acceptable in Portuguese context:
- **OSS** - Keep as is (universal BJJ greeting)
- **No-Gi** - Keep as is (technical term)
- **Kimono** - NOT "Gi" (use Portuguese term)

## Adding New Translations

1. Add to `src/locales/pt.json`:
```json
{
  "section": {
    "key": "Tradução em Português"
  }
}
```

2. Use in component:
```typescript
import { useLanguage } from '../contexts/LanguageContext';

const { t } = useLanguage();
// ...
<p>{t('section.key')}</p>
```

## Automated Checks

The `validate-translations.js` script runs automatically in CI/CD to catch:
- Hardcoded English text
- Missing translations
- Inconsistent terminology

Run it locally:
```bash
npm run validate:translations
```

Add this to `package.json`:
```json
{
  "scripts": {
    "validate:translations": "node validate-translations.js"
  }
}
```
