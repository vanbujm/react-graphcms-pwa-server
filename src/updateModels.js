import { readFile } from 'fs';
import { parseString } from 'xml2js';
import { camelCase } from 'lodash/string';

export const updateModels = async () => {
  const readXml = () => {
    return new Promise((resolve, reject) => {
      return readFile('./ru1_compfixtures.xml', 'utf8', (err, data) => {
        return err ? reject(err) : resolve(data);
      });
    });
  };

  const parseXml = data => {
    return new Promise((resolve, reject) => {
      return parseString(
        data,
        {
          attrkey: '_attributes',
          attrNameProcessors: [name => camelCase(name)]
        },
        (err, data) => {
          return err ? reject(err) : resolve(data);
        }
      );
    });
  };

  const xmlFile = await readXml();
  const data = await parseXml(xmlFile);

  const xmlTeams = data.fixtures.teams[0].team;
  const xmlFixtures = data.fixtures.fixture;

  const venueObj = {};

  const parseTeams = xmlTeam => ({
    name: xmlTeam._attributes.name,
    teamId: xmlTeam._attributes.id
  });

  const parseFixtures = xmlFixture => {
    const { id, datetime, round, venueId, venue } = xmlFixture._attributes;
    const teams = xmlFixture.team;
    const teamsObj = teams.reduce((result, teamObj) => {
      const team = teamObj._attributes;
      result[team.homeOrAway] = { teamId: team.teamId, score: team.score };
      return result;
    }, {});

    venueObj[venueId] = { venueId, name: venue };

    const { home, away } = teamsObj;

    return {
      fixtureId: id,
      fixtureDate: datetime,
      round,
      venue: venueId,
      homeTeam: home.teamId,
      awayTeam: away.teamId,
      homeScore: home.score,
      awayScore: away.score
    };
  };

  const graphTeams = xmlTeams.map(parseTeams);
  const graphFixtures = xmlFixtures.map(parseFixtures);
  const graphVenues = Object.values(venueObj);

  return { graphTeams, graphFixtures, graphVenues };
};

export const createTeamMutations = graphTeams => {
  return Object.values(graphTeams).map(team =>
    `
      mutation {
        upsertTeam(
          where: {
            teamId: ${team.teamId}
          }
          create:{
            teamId: ${team.teamId}
            name: "${team.name}"
          }
          update:{
            teamId: ${team.teamId}
            name: "${team.name}"
          }
        ) {
          id
          teamId
        }
      }
      `
      .replace('\n', '')
      .replace(/\s+/g, ' ')
      .trim()
  );
};

export const createVenueMutations = graphVenues => {
  return Object.values(graphVenues).map(venue =>
    `
      mutation {
        upsertVenue(
          where: {
            venueId: ${venue.venueId}
          }
          create:{
            venueId: ${venue.venueId}
            venueName: "${venue.name}"
          }
          update:{
            venueId: ${venue.venueId}
            venueName: "${venue.name}"
          }
        ) {
          id
          venueId
        }
      }
      `
      .replace('\n', '')
      .replace(/\s+/g, ' ')
      .trim()
  );
};

export const createFixtureMutations = graphFixtures => {
  return Object.values(graphFixtures).map(fixture =>
    `
      mutation {
        upsertFixture(
          where: {
            fixtureId: ${fixture.fixtureId}
          }
          create: {
            fixtureId: ${fixture.fixtureId}
            fixtureDate: "${fixture.fixtureDate}"
            round: ${fixture.round}
            venue: {
              connect: {
                  venueId: ${fixture.venue}
              }
            }
            homeTeam: {
              connect: {
                teamId: ${fixture.homeTeam}
              }
            }
            awayTeam: {
              connect: {
                teamId: ${fixture.awayTeam}
              }
            }
            homeScore: ${fixture.homeScore}
            awayScore: ${fixture.awayScore}
          }
          update: {
            fixtureId: ${fixture.fixtureId}
            fixtureDate: "${fixture.fixtureDate}"
            round: ${fixture.round}
            venue: {
              connect: {
                  venueId: ${fixture.venue}
              }
            }
            homeTeam: {
              connect: {
                teamId: ${fixture.homeTeam}
              }
            }
            awayTeam: {
              connect: {
                teamId: ${fixture.awayTeam}
              }
            }
            homeScore: ${fixture.homeScore}
            awayScore: ${fixture.awayScore}
          }
        ) {
          id
          fixtureId
          homeTeam {
            teamId
            name
          }
          awayTeam {
            teamId
            name
          }
          venue {
            venueName
          }
        }
      }
      `
      .replace('\n', '')
      .replace(/\s+/g, ' ')
      .trim()
  );
};

export default async () => {
  const { graphTeams, graphVenues, graphFixtures } = await updateModels();

  const teamMutations = createTeamMutations(graphTeams);
  const venueMutations = createVenueMutations(graphVenues);
  const fixtureMutations = createFixtureMutations(graphFixtures);

  return [...teamMutations, ...venueMutations, ...fixtureMutations];
};
