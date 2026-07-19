# SESSION_STATE — CaseLane — 2026-07-19

## FEITO E VALIDADO

- Fundação, autenticação, tenancy, convites, clientes e Vertical 1 concluídos.
- CL-Q102 concluiu a gestão de equipe com perfil, papel, workload, suspensão reversível e owner protegido.
- Vertical 2 concluída: portal CLIENT separado, submissão de requests na mesma fila interna, detalhe, status em linguagem pública, conversa compartilhada e respostas.
- Segurança do portal validada no PostgreSQL e navegador: tenant/client derivados no servidor, prioridade e ownership não forjáveis, notas INTERNAL ausentes do objeto, HTML e conversa pública.
- CL-Q103 concluiu acesso demo com um clique para Owner, Team member e Client. Senha não é renderizada nem enviada; flag, is_demo, usuário, membership e vínculo de contato são verificados no servidor.
- Login demo redesenhado em duas colunas 50/50. A esquerda ocupa 100% da altura no desktop; desktop 1440x900 e mobile 390px foram medidos sem overflow.
- Último gate técnico: 99 testes em 39 arquivos, lint sem avisos, TypeScript e production build aprovados.
- Servidor local reiniciado em http://localhost:3108; PostgreSQL em 55432.
- ADR-012 registra o boundary permanente do acesso demo.
- Dados demo restaurados para Orbit Labs com 12 cases.

## EM ANDAMENTO (parei aqui)

- Nenhum ticket ativo.
- Gate de revisão da Vertical 2 aguardando aprovação explícita do Fabio.
- O login novo está disponível em http://localhost:3108/sign-in.

## PENDÊNCIAS (ordem de ataque)

1. [GIT/PUBLICAÇÃO] O repositório local não tem remote configurado. Confirmar estado e configurar `origin` para `https://github.com/fabiorosa/caselane.git`; publicar sem segredos, logs locais ou atribuição ao Codex.
2. [GATE] Fabio revisar as três personas e aprovar explicitamente a Vertical 2.
3. [CL-Q101] Remover travessões e copy artificial de metadata, UI, seed e docs públicos com reescrita natural.
4. [CL-V301] Settings, segurança, rate limiting, headers, logs, health, cookies, acessibilidade e secret scan.
5. [CL-V302] Walkthrough automatizado owner/member/client, migrations do zero, CI e smoke de preview.
6. [CL-V303] README, arquitetura/tradeoffs, disclosure de IA, screenshots, vídeo, deploy, HTTPS, domínio, release e links de portfólio.

## DECISÕES (por quê)

- CaseLane é produto público de portfólio, não MVP descartável; cada vertical entrega uma jornada completa.
- Request no portal e Case na operação são o mesmo registro, com linguagem adequada ao papel.
- Portal usa query própria que nunca busca notas internas ou metadata operacional.
- Acesso demo é uma sessão normal emitida no servidor, nunca senha preenchida no HTML.
- Atalho demo fica desligado por padrão e exige flag explícita mais organização is_demo.
- Login público usa divisão 50/50: superfície integral de autenticação à esquerda e perspectivas demo à direita.
- Deleção de identidades é evitada; suspensão preserva histórico.
- CL-Q101 exige reescrita humana, não troca mecânica de pontuação.

## BECOS SEM SAÍDA (não repetir)

- Acessar o portal com sessão interna retornava 404 genérico; o demo agora redireciona ao seletor com orientação.
- Usar credenciais PostgreSQL postgres/postgres falha; conexão local correta é caselane/caselane na porta 55432.
- Rodar build enquanto um processo Next antigo serve a mesma .next pode deixar conteúdo desatualizado; após build, reiniciar exatamente o listener de 3108.
- Capturas longas do navegador podem aparecer cortadas/comprimidas; confirmar geometria com getBoundingClientRect e overflow antes de alterar CSS.
- Não preencher nem embutir a senha demo no cliente.

## DÚVIDAS ABERTAS

- Provedor final de hosting/Next.js, PostgreSQL gerenciado, DNS e domínio.
- Provedor futuro de e-mail transacional e object storage.
- Essas escolhas pertencem à Vertical 3; não bloqueiam o gate atual.

## PRÓXIMO_PASSO

Confirmar o gate da Vertical 2 com Fabio; não iniciar a Vertical 3 antes da aprovação explícita.

## PENDENTE_TESTE

Validação humana final do layout 50/50 e da jornada one-click Client → request/reply → Owner; testes automatizados já estão verdes.

## PROMPT DE CONTINUIDADE

```
Continue o desenvolvimento do CaseLane em C:\laragon\www\dev\caselane. O produto é a principal peça pública de portfólio Product Engineer do Fabio Rosa. A Vertical 2 está implementada e tecnicamente validada; a sessão deve começar resolvendo o gate de revisão e preparando a fase final de publicação, sem voltar a uma abordagem de MVP.

Leia primeiro: AGENTS.md, docs/SESSION_STATE.md e todos os documentos obrigatórios indicados no AGENTS.md. Para a próxima fase, leia especialmente docs/BACKLOG.md, docs/ROADMAP.md, docs/TESTING.md, docs/DECISIONS.md e docs/UI_SPEC.md.

1. Confirme o estado local e o gate da Vertical 2. Critério de aceite: servidor em 3108, PostgreSQL em 55432, login demo 50/50 funcionando com Owner, Team member e Client, jornada client request/reply visível no workroom interno, e conteúdo INTERNAL ausente do portal. Se Fabio ainda não aprovou o gate, pare após apresentar um checklist curto e aguarde aprovação; não inicie a Vertical 3.
2. Configure o remote origin para https://github.com/fabiorosa/caselane.git e publique o commit local somente se o remote continuar ausente e o estado estiver coerente. Critério de aceite: branch pública disponível no GitHub, sem .env, logs locais, segredos ou atribuição ao Codex; respeite o hook local de autoria.
3. Após aprovação explícita da Vertical 2, execute exatamente um ticket por vez. Comece por CL-Q101 e remova travessões/copy artificial de todas as superfícies e docs públicos com reescrita natural, não substituição cega. Critério de aceite: metadata, UI e copy pública em US English natural, com teste preventivo e build verde.
4. Continue a Vertical 3 na ordem CL-V301 → CL-V302 → CL-V303, respeitando cada definition of done e gate. Critério de aceite: settings, segurança, observabilidade, acessibilidade, testes end-to-end, documentação, evidências, deploy HTTPS e release pública completos conforme BACKLOG.
5. Ao concluir cada ticket, rode PostgreSQL tests, lint e production build, valide a UI real em 3108 quando aplicável, atualize docs/BACKLOG.md e docs/SESSION_STATE.md e só então avance.

Execução 100% autônoma do início ao fim. Não me pergunte nada que dê pra decidir investigando o código ou o SESSION_STATE. Dúvidas: junte todas e me pergunte no FINAL, nunca no meio. Vá 1→2→3→…, valide cada uma observando o comportamento real (não "está no DOM/commitado" = pronto), e me devolva no fim a lista de aceites pra eu validar de uma vez.

UI segue o padrão dark premium do sistema (fundo escuro + 1 acento, respiro generoso). Zero emoji na interface — sempre SVG premium. Antes de desenhar, carregue a skill gosto-de-design + vicios-de-design.

Delegue varredura/busca pesada a sub-agente barato (effort low) pra poupar contexto; você (agente principal) valida tudo antes de aceitar.

Regras fixas: nunca use a porta 3000; CaseLane usa 3108 e PostgreSQL 55432. Trabalhe um ticket por vez. Não comece um milestone antes do gate. Preserve tenant isolation server-side, PostgreSQL como verdade, TypeScript strict e documentação pública em inglês.
```

