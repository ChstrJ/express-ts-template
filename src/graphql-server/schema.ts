import { mergeResolvers, mergeTypeDefs } from '@graphql-tools/merge';
import { usersTypeDefs } from './module/users/users.typeDefs';
import { usersResolvers } from './module/users/users.resolver';

export const typeDefs = mergeTypeDefs([
  usersTypeDefs
]);

export const resolvers = mergeResolvers([
  usersResolvers
]);




