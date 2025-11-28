# Como Criar Usuários Demo Reais - Automatizado

## Passo-a-Passo

### 1. Obter Service Role Key

1. Acesse **Supabase Dashboard**
2. Vá em **Settings** → **API**
3. Copie a chave **`service_role`** (secret key)
   - ⚠️ **IMPORTANTE**: Esta chave é secreta! Nunca comite no Git.

### 2. Configurar o Script

Edite `create-demo-users.js` e substitua:
```javascript
const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE'
```

Cole a service role key que você copiou.

### 3. Executar Script

```bash
node create-demo-users.js
```

Isso vai criar 5 usuários com:
- ✅ Email confirmado automaticamente
- ✅ Perfis criados
- ✅ Senhas: `DemoPassword123!`

### 4. Adicionar às Academias

Execute no Supabase SQL Editor:
```sql
-- Copie e cole o conteúdo de setup-demo-memberships.sql
```

### 5. Ativar RLS (Opcional)

Se quiser segurança:
```sql
-- Execute enable-rls-production.sql
```

## Usuários Criados

1. **Carlos Silva** - `carlos.silva.demo@example.com` - Faixa Branca (2 graus)
2. **Ana Santos** - `ana.santos.demo@example.com` - Faixa Branca
3. **Pedro Oliveira** - `pedro.oliveira.demo@example.com` - Faixa Azul (1 grau)
4. **Maria Costa** - `maria.costa.demo@example.com` - Faixa Azul (3 graus)
5. **João Mendes** - `joao.mendes.demo@example.com` - Faixa Roxa

Senha para todos: `DemoPassword123!`
