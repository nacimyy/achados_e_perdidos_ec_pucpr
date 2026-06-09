# Achados e Perdidos PUCPR

Aplicação web responsiva baseada nas telas da pasta `Entrega - ACHADOS E PERDIDOS (1)`.

## Tecnologias

- HTML para a estrutura do frontend
- CSS para a estilização e responsividade
- JavaScript para o comportamento do frontend e para o backend em Node.js/Express

## Recursos

- Catálogo público com busca, ordenação e filtros
- Visualização detalhada com galeria de fotos
- Área administrativa para funcionários
- Cadastro e edição de itens com upload local
- Registro de resgate, expiração e doação
- Persistência local em SQLite
- Layout responsivo para desktop e celular

## Executar

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
API: `http://localhost:3001`

Para gerar e executar a versão de produção:

```bash
npm run build
npm start
```

A aplicação completa ficará em `http://localhost:3001`.

## Acesso administrativo

- E-mail: `funcionario@pucpr.br`
- Senha: `pucpr`

## Verificações

Com o servidor em execução:

```bash
npm run check
npm run build
npm run test:api
```

O banco é criado automaticamente em `data/achados-perdidos.db` na primeira execução.
