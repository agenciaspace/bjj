# 🔐 Configuração AWS Rekognition

## Passo 1: Criar conta AWS (se não tiver)

1. Acesse: https://aws.amazon.com/
2. Clique em "Create an AWS Account"
3. Complete o cadastro (precisa de cartão de crédito, mas free tier é grátis)

## Passo 2: Criar usuário IAM com permissões Rekognition

### 2.1. Acessar IAM Console
1. Faça login no AWS Console: https://console.aws.amazon.com/
2. Busque por "IAM" no topo
3. Clique em "IAM" (Identity and Access Management)

### 2.2. Criar novo usuário
1. No menu lateral, clique em "Users"
2. Clique em "Create user"
3. Nome do usuário: `bjj-rekognition-api`
4. Marque: ✅ "Provide user access to the AWS Management Console" (opcional)
5. Clique em "Next"

### 2.3. Adicionar permissões
1. Selecione "Attach policies directly"
2. Busque e selecione: **`AmazonRekognitionReadOnlyAccess`**
   - Permite apenas leitura (detect faces, compare faces)
   - Mais seguro que full access
3. Clique em "Next" → "Create user"

### 2.4. Criar Access Keys
1. Clique no usuário criado (`bjj-rekognition-api`)
2. Vá na aba "Security credentials"
3. Role até "Access keys"
4. Clique em "Create access key"
5. Selecione "Application running outside AWS"
6. Clique em "Next" → "Create access key"
7. **⚠️ IMPORTANTE**: Copie e salve:
   - `Access key ID` (ex: AKIAIOSFODNN7EXAMPLE)
   - `Secret access key` (ex: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY)

   **Você não poderá ver o Secret key novamente!**

## Passo 3: Configurar no Vercel

### 3.1. Acessar Project Settings
1. Vá para: https://vercel.com/dashboard
2. Selecione o projeto "bjj"
3. Vá em "Settings" → "Environment Variables"

### 3.2. Adicionar variáveis
Adicione estas 3 variáveis (clique em "Add" para cada):

| Name | Value | Environment |
|------|-------|-------------|
| `AWS_ACCESS_KEY_ID` | (cole o Access key ID copiado) | Production, Preview, Development |
| `AWS_SECRET_ACCESS_KEY` | (cole o Secret access key) | Production, Preview, Development |
| `AWS_REGION` | `us-east-1` | Production, Preview, Development |

**⚠️ IMPORTANTE**: Marque os 3 ambientes (Production, Preview, Development) para cada variável!

### 3.3. Salvar
1. Clique em "Save" após adicionar cada variável
2. As variáveis estarão disponíveis no próximo deploy

## Passo 4: Deploy

```bash
cd ~/Documents/bjj
vercel --prod
```

## Passo 5: Testar

```bash
# Testar se API está configurada
vercel curl /api/

# Deve retornar:
# {
#   "message": "BJJ Face Recognition API (AWS Rekognition)",
#   "status": "ready",
#   "provider": "AWS Rekognition",
#   "version": "2.0.0"
# }
```

## 📊 Monitorar Custos

### Free Tier (12 meses)
- 1.000 imagens/mês grátis
- Renova todo mês

### Depois do Free Tier
- $0.001 por imagem (primeiras 1M)
- Para 1.000 requisições/mês = $1.00

### Como monitorar
1. AWS Console → Billing Dashboard
2. Veja uso em: AWS Console → Rekognition → Usage

## 🔒 Segurança

### Boas práticas:
✅ Use IAM user específico (não use root account)
✅ Use apenas permissões necessárias (ReadOnly é suficiente)
✅ Nunca commite as keys no git
✅ Rotacione as keys periodicamente (a cada 6 meses)
✅ Monitore uso no AWS CloudTrail

### Se as keys vazarem:
1. AWS Console → IAM → Users → seu usuário
2. Security credentials → Deactivate ou Delete as keys comprometidas
3. Crie novas keys
4. Atualize no Vercel

## 🆘 Troubleshooting

### Erro: "AWS Rekognition not configured"
- Verifique se as 3 variáveis estão no Vercel
- Faça novo deploy: `vercel --prod`

### Erro: "InvalidSignature" ou "SignatureDoesNotMatch"
- Secret key está incorreto
- Verifique se copiou corretamente
- Crie novas keys se necessário

### Erro: "UnauthorizedOperation" ou "AccessDenied"
- Usuário IAM não tem permissões
- Adicione policy `AmazonRekognitionReadOnlyAccess`

### Erro: "InvalidParameterException"
- Imagem inválida ou sem faces
- Certifique-se que a imagem tem pelo menos uma face

## 💰 Estimativa de Custos

| Uso Mensal | Free Tier (12 meses) | Depois Free Tier |
|------------|----------------------|------------------|
| 100 fotos  | Grátis | $0.10 |
| 500 fotos  | Grátis | $0.50 |
| 1.000 fotos | Grátis | $1.00 |
| 5.000 fotos | $4.00 | $5.00 |

**Total com Vercel**: $20-25/mês (muito melhor que tentar hospedar modelos!)
