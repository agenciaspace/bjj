# Configuração de Credenciais AWS no Vercel

## Status Atual ✅

**Backend Node.js está funcionando!** Todos os endpoints estão ativos:

- ✅ `GET /api` - Health check
- ✅ `POST /api/detect` - Detectar faces
- ✅ `POST /api/analyze` - Analisar faces (emoções, idade, gênero)
- ✅ `POST /api/verify` - Comparar e verificar faces

**Falta apenas:** Configurar credenciais AWS para o Rekognition funcionar.

## Passo 1: Criar Usuário IAM na AWS

1. **Acesse o Console da AWS**: https://console.aws.amazon.com/iam/

2. **Vá para Users** → **Add users**

3. **Configure o usuário:**
   - **User name**: `bjj-rekognition-api`
   - **Access type**: ✅ **Access key - Programmatic access**

4. **Permissions** → **Attach existing policies directly**:
   - Busque e selecione: `AmazonRekognitionFullAccess`

5. **Review** → **Create user**

6. **IMPORTANTE: Copie as credenciais:**
   ```
   Access key ID: AKIA...
   Secret access key: wJalrXUt...
   ```
   ⚠️ **Guarde em local seguro! Não será mostrado novamente.**

## Passo 2: Configurar Variáveis no Vercel

### Método 1: Via Dashboard (Recomendado)

1. Acesse: https://vercel.com/kofe/bjj/settings/environment-variables

2. Adicione 3 variáveis:

   **Variável 1:**
   - **Key**: `AWS_ACCESS_KEY_ID`
   - **Value**: (cole o Access Key ID da AWS)
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development

   **Variável 2:**
   - **Key**: `AWS_SECRET_ACCESS_KEY`
   - **Value**: (cole o Secret Access Key da AWS)
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development

   **Variável 3:**
   - **Key**: `AWS_REGION`
   - **Value**: `us-east-1`
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development

3. Clique em **Save** para cada variável

### Método 2: Via CLI

```bash
vercel env add AWS_ACCESS_KEY_ID production
# Cole o Access Key ID e pressione Enter

vercel env add AWS_SECRET_ACCESS_KEY production
# Cole o Secret Access Key e pressione Enter

vercel env add AWS_REGION production
# Digite: us-east-1 e pressione Enter
```

## Passo 3: Redesenhar para Aplicar Variáveis

Após adicionar as variáveis, você precisa redesenhar o projeto:

```bash
vercel --prod
```

Ou no dashboard: **Deployments** → **Redeploy** (último deployment)

## Passo 4: Testar a API

Após o redeploy, teste os endpoints:

### 1. Health Check
```bash
curl https://bjj-kofe.vercel.app/api
```

**Resposta esperada:**
```json
{
  "status": "ready",  ← Deve mostrar "ready" agora!
  "note": "AWS credentials configured"
}
```

### 2. Detectar Faces
```bash
curl -X POST https://bjj-kofe.vercel.app/api/detect \
  -F "file=@test-face.jpg"
```

**Resposta esperada:**
```json
{
  "faces": [
    {
      "box": { "left": 0.2, "top": 0.3, "width": 0.4, "height": 0.5 },
      "confidence": 99.8
    }
  ],
  "count": 1,
  "provider": "AWS Rekognition"
}
```

### 3. Analisar Faces
```bash
curl -X POST https://bjj-kofe.vercel.app/api/analyze \
  -F "file=@test-face.jpg"
```

### 4. Verificar/Comparar Faces
```bash
curl -X POST https://bjj-kofe.vercel.app/api/verify \
  -F "img1=@face1.jpg" \
  -F "img2=@face2.jpg" \
  -F "threshold=90"
```

## Estimativa de Custos

### AWS Rekognition (Região us-east-1)
- **Primeiras 1.000 imagens/mês**: GRÁTIS
- **1.001 - 1.000.000 imagens**: $0.001 por imagem
- **Acima de 1.000.000**: $0.0006 por imagem

### Exemplo de Uso Mensal
- **100 verificações/dia** × 30 dias = 3.000 imagens/mês
- Custo: (3.000 - 1.000) × $0.001 = **$2.00/mês**

### Total Mensal Estimado
- Vercel Pro: $20/mês
- AWS Rekognition: ~$2-5/mês
- **Total: ~$22-25/mês**

## Segurança

✅ **Boas práticas implementadas:**

1. Credenciais armazenadas como variáveis de ambiente (não no código)
2. Acesso limitado apenas ao Rekognition (política IAM restrita)
3. HTTPS obrigatório em todos os endpoints
4. Deployment Protection ativa no Vercel

⚠️ **Importante:**
- Nunca commite credenciais no git
- Rotacione as chaves periodicamente (a cada 90 dias)
- Monitore uso via AWS CloudWatch

## Troubleshooting

### Erro: "AWS Rekognition not configured"
**Causa:** Variáveis de ambiente não configuradas ou redeploy pendente
**Solução:** Verifique as variáveis no dashboard e faça redeploy

### Erro: "Access Denied"
**Causa:** Credenciais inválidas ou política IAM incorreta
**Solução:** Recrie o usuário IAM e garanta a política `AmazonRekognitionFullAccess`

### Erro: "Rate limit exceeded"
**Causa:** Muitas requisições simultâneas
**Solução:** AWS Rekognition tem limite padrão de 5 TPS (transações por segundo). Solicite aumento via AWS Support se necessário.

## Próximos Passos

Após configurar as credenciais:

1. ✅ Testar todos os endpoints da API
2. ✅ Verificar integração com o frontend
3. ✅ Testar upload de fotos de turma
4. ✅ Configurar monitoramento de custos na AWS
5. ✅ Documentar fluxo de uso para usuários finais

---

**Documentação completa:** [AWS_SETUP.md](./AWS_SETUP.md)
