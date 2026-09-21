<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

# DRAGON BALL API
A REST API built with NestJS and MongoDB for managing data from the Dragon Ball
universe. It currently implements full CRUD operations and has the database
connection fully configured.

## Description
This project exposes a set of endpoints that allow you to create, read, update
and delete Dragon Ball character records. All data is persisted in a MongoDB
database, which makes it easy to scale the project and add new features later
on (authentication, pagination, filters, sagas, techniques, transformations).

## Project setup

```bash
$ yarn install
```

## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## DEV
1. Clonar el repositorio
```
git clone https://github.com/Leandrop011/dragon-ball-api.git
```
2. Instalar dependencias
```
yarn install
```
3. Renombrar el archivo .env-template a ```.env```.
4. Configurar las respectivas variables de entorno.
5. Levantar la Base de Datos
```
docker compose up -d
```
6. Levantar el proyecto en modo desarrollo
```
yarn start:dev
```