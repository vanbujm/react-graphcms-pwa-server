import {
  parseOptaXml,
  createTeamMutations,
  createVenueMutations,
  createFixtureMutations
} from './updateModels';

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Copyright 2001-2015 Opta Sportsdata Ltd. All rights reserved. -->

<!-- PRODUCTION HEADER
     produced on:        valde-jobq-a08.nexus.opta.net
     production time:    20150702T110651,954Z
     production module:  Opta::Feed::XML::RugbyUnion::RU1
-->
<fixtures>
  <fixture id="115014" comp_id="201" comp_name="Aviva Premiership" datetime="2014-09-05T18:45:00+0000" game_date="20140905" group="1" group_name="1" leg="1" live_scores="11" public="1" round="1" round_type_id="1" season_id="2015" stage="1" status="Result" time="19:45:00" venue="Franklin's Gardens" venue_id="28">
    <team eighty_min_score="" home_or_away="home" score="53" team_id="1400" />
    <team eighty_min_score="" home_or_away="away" score="6" team_id="1100" />
  </fixture>
  <teams>
    <team id="78" name="London Welsh" />
  </teams>
</fixtures>`;

it('creates mutations', async () => {
  const { graphTeams, graphVenues, graphFixtures } = await parseOptaXml(xml);

  const teamMutations = createTeamMutations(graphTeams);
  const venueMutations = createVenueMutations(graphVenues);
  const fixtureMutations = createFixtureMutations(graphFixtures);

  expect(teamMutations).toMatchSnapshot();
  expect(venueMutations).toMatchSnapshot();
  expect(fixtureMutations).toMatchSnapshot();
});
