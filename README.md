# Controle de Ponto API

> Este projeto é parte de um desafio e foi desenvolvido sem fins comerciais ou algo do tipo.

API Rest para cadastro de uma folha de ponto

## Tecnologias utilizadas

- Node.JS v18.18
- Express v4.18.2
- MongoDB

> Foi utilizado o MongoDB para o armazenamento das informações pela praticidade. Utilizando um JSON no filesystem daria muito trabalho para ficar lendo e bloqueando o arquivo; e utilizando um SQLite precisaria definir schemas de tabelas e talvez migrations.

## Resumo

A API possui dois endpoints, o primeiro é um POST que recebe uma data com o momento que o ponto é batido e o segundo endpoint é um GET que recebe o mês por parâmetro na URL e retorna um relatório detalhado com os pontos batidos no mês.

## Executando localmente

O projeto utiliza Docker então não há necessidade de instalar nenhuma das tecnologias mencionadas acima.

- Configure o .env baseado no arquivo .env.sample.
  > Para conectar com o MongoDB no docker-compose: `DB_CONNECTION=mongodb://root:example@db:27017`
- O nome do banco pode ser qualquer string.
- Execute o docker compose para subir o projeto:

```bash
docker-compose up -d
```

- A aplicação irá executar na porta `3000`: http://localhost:3000
- Também ira subir uma interface de gerenciamento do mongo na porta `8081`, caso queria visualizar os dados.

## Testes unitários

Para rodar os testes execute o seguinte comando:

```
docker-compose exec -it app npm run test
```

Também é possível verificar a cobertura de testes com o comando:

```
docker-compose exec -it app npm run test:coverage
```
