const { gql, GraphQLClient } = require('graphql-request');
require('dotenv').config();

module.exports = {
  commands: [],
  perms: "OWNEROFTHEBOT",
  run: async (message, args, text, client) => {
    const apiUrl = "https://data.charitynavigator.org";
    const apiKey = process.env.CHARITY_API_KEY;

      const QLClient = new GraphQLClient(apiUrl, {
        headers: {
          'Stellate-Api-Token': apiKey,
        },
      });
    const query = gql`
      query PublicSearchFaceted {
        publicSearchFaceted (term: "animal", result_size: 1000) {
          size
          term
          results {
            ein
            name
            mission
            organization_url
            charity_navigator_url
            cause
            street
            street2
            city
            state
            zip
            country
          }
        }
      }
      `;

      QLClient
      .request(query)
      .then(data => {
        // Handle the response data here
        console.log(data);
      })
      .catch(error => {
        // Handle any errors that occur
        console.error(error);
      });
  },
};
