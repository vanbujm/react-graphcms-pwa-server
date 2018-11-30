import fetch from 'node-fetch';
import { introspectSchema, makeRemoteExecutableSchema } from 'apollo-server';
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
import { HttpLink } from 'apollo-link-http';
import chalk from 'chalk';
import morgan from 'morgan';
import { json, urlencoded } from 'body-parser';

const PORT = 4000;
const statusOk = status => status >= 200 && status < 300;
const formatStatusCode = status =>
  chalk`{${statusOk(status) ? 'blue' : 'red'}.bold ${status}}`;

const morganChalk = morgan((tokens, req, res) =>
  [
    chalk`{green.bold ${tokens.method(req, res)}}`,
    formatStatusCode(tokens.status(req, res)),
    chalk`{white ${tokens.url(req, res)}}`,
    chalk`{yellow ${tokens['response-time'](req, res)} ms}`,
    req.body !== undefined
      ? chalk`\n    {cyan.bold BODY} {magenta ${JSON.stringify(req.body)}}`
      : null
  ].join(' ')
);

async function run() {
  const app = express();

  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.use(morganChalk);

  // 1. Create Apollo Link that's connected to the underlying GraphQL API
  const link = new HttpLink({
    uri: 'https://api-apeast.graphcms.com/v1/cjo6hiawa52m901fuqghxzdib/master',
    fetch
  });

  // 2. Retrieve schema definition of the underlying GraphQL API
  const schema = await introspectSchema(link);

  // 3. Create the executable schema based on schema definition and Apollo Link
  const executableSchema = makeRemoteExecutableSchema({
    schema,
    link
  });

  // 4. Create and start proxy server based on the executable schema
  const server = new ApolloServer({
    schema: executableSchema
  });

  server.applyMiddleware({ app });

  app.use((req, res, next) => {
    console.log(res.getHeaders());
    next();
  });

  app.listen({ port: PORT }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
}

// noinspection JSIgnoredPromiseFromCall
run();
