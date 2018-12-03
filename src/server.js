import fetch from 'node-fetch';
import { introspectSchema, makeRemoteExecutableSchema } from 'apollo-server';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { HttpLink } from 'apollo-link-http';
import { json, urlencoded, text } from 'body-parser';
import depthLimit from 'graphql-depth-limit';
import cors from 'cors';
import { graphql } from 'graphql';

import updateModels, {
  createFixtureMutations,
  createTeamMutations,
  createVenueMutations,
  parseOptaXml
} from './updateModels';
import logging from './logging';

const PORT = 4000;

async function run() {
  const mutations = await updateModels();
  const app = express();

  app.use(json());
  app.use(text({ type: 'text/xml' }));
  app.use(urlencoded({ extended: true }));
  app.use(logging);
  app.use(cors());

  app.post('/xml', async (req, res) => {
    const { graphTeams, graphVenues, graphFixtures } = await parseOptaXml(
      req.body
    );

    const teamMutations = createTeamMutations(graphTeams);
    const venueMutations = createVenueMutations(graphVenues);
    const fixtureMutations = createFixtureMutations(graphFixtures);
    await Promise.all(
      [...teamMutations, ...venueMutations, ...fixtureMutations].map(
        mutation => {
          return graphql(executableSchema, mutation);
        }
      )
    );
    res.json({ ok: 200 });
  });

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
    schema: executableSchema,
    validationRules: [depthLimit(5)]
  });

  server.applyMiddleware({ app });

  await mutations.forEach(mutation => {
    graphql(executableSchema, mutation);
  });

  app.listen({ port: PORT }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
}

// noinspection JSIgnoredPromiseFromCall
run();
