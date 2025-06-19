import gql from "graphql-tag";

export const usersTypeDefs = gql`

  type User {
      account_id: String!
      account_email: String!
      account_first_name: String!
      account_last_name: String!
      account_type: String!
  }

  type Query {
    users: [User!]!
    hello: String
    greet(name: String!): String
  }
`;

