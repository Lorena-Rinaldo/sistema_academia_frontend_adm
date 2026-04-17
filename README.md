# IRON GYM | Painel Administrativo

## Descrição

Este projeto é um painel administrativo de frontend para a academia **IRON GYM**. Ele permite que administradores façam login, visualizem a lista de alunos, cadastrem novos alunos, editem registros existentes e excluam alunos usando uma interface moderna e responsiva.

O frontend consome uma API externa para autenticação e gerenciamento de alunos, mantendo o CPF formatado no UI e limpo ao enviar os dados para o backend.

## Funcionalidades principais

- Autenticação segura via API com JWT.
- Gestão completa de alunos: listagem, cadastro, edição e exclusão.
- Máscara de CPF exibida no frontend e CPF limpo enviado ao servidor.
- Status de aluno: Ativo ou Inativo.
- Modal de cadastro/edição com animação.
- Logout automático e proteção de tela administrativa.
- Interface estilizada em tema escuro com detalhes dourados.

## Tecnologias utilizadas

- HTML5
- CSS customizado
- JavaScript puro (ES6+)
- Tailwind CSS via CDN
- Fetch API para comunicação com o backend
- Session Storage para persistência temporária de autenticação

## Arquivos principais

- `index.html` – estrutura do painel, login e modal de cadastro.
- `script.js` – lógica de autenticação, CRUD de alunos, renderização de tabela e máscaras de CPF.

## Como usar

### Requisitos

- Navegador moderno com suporte a JavaScript.
- Conexão com a internet para carregar o Tailwind via CDN.
- Backend ativo na URL configurada em `script.js`.

### Passo a passo

1. Abra o arquivo `index.html` no navegador ou execute um servidor local.
2. Informe o usuário e a senha no formulário de login.
3. Após o login bem-sucedido, o painel administrativo aparecerá.
4. Use o botão **+ Novo Aluno** para abrir o modal de cadastro.
5. Preencha o nome, CPF e status do aluno.
6. Clique em **Confirmar** para salvar.
7. Use os botões **EDITAR** e **EXCLUIR** para gerenciar os registros.
8. Clique em **SAIR** para encerrar a sessão.

## Configuração de API

O frontend está configurado para se conectar ao backend através de `script.js`:

```js
const CONFIG = {
    API_URL: 'https://sistema-academia-backend-hx4f.vercel.app',
    TOKEN_KEY: 'iron_jwt_token',
    AUTH_KEY: 'iron_auth'
};
```

### Endpoints utilizados

- `POST /login` — autenticação de usuário.
- `GET /alunos` — lista todos os alunos.
- `POST /alunos` — cadastra um novo aluno.
- `PUT /alunos/:cpf` — atualiza um aluno existente.
- `DELETE /alunos/:cpf` — remove um aluno.

### Observações importantes

- O CPF é exibido formatado no UI (000.000.000-00), mas é enviado ao backend apenas com dígitos.
- Se a sessão expirar ou o token for inválido, o usuário é redirecionado para o login.
- O backend precisa estar disponível e retornar JSON para o frontend funcionar corretamente.

## Estrutura do projeto

```
index.html
script.js
README.md
```

## Design e experiência

O layout foi pensado para criar uma sensação premium e sofisticada, com:

- Tema escuro e contrastes dourados.
- Cartões com efeito glassmorphism.
- Tabela responsiva e ações claras.
- Modal suave com transição de abertura.

## Melhorias futuras sugeridas

- Adicionar validação de CPF no frontend.
- Implementar paginação e pesquisa na lista de alunos.
- Adicionar filtros por status e ordenação.
- Criar um dashboard com métricas de alunos.
- Separar estilos em arquivo `styles.css` para melhor manutenção.

## Autoras

- ISABELLY FERREIRA: https://github.com/isabelly-lima05
- LORENA RINALDO: https://github.com/Lorena-Rinaldo

## Licença

Projeto desenvolvido para fins educacionais. A licença não foi especificada.