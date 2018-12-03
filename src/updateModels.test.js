import {
  updateModels,
  createTeamMutations,
  createVenueMutations,
  createFixtureMutations
} from './updateModels';

it('creates mutations', async () => {
  const { graphTeams, graphVenues, graphFixtures } = await updateModels();

  const teamMutations = createTeamMutations(graphTeams);
  const venueMutations = createVenueMutations(graphVenues);
  const fixtureMutations = createFixtureMutations(graphFixtures);

  expect(teamMutations).toMatchSnapshot();
  expect(venueMutations).toMatchSnapshot();
  expect(fixtureMutations).toMatchSnapshot();
});
