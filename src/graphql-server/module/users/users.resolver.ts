import prisma from "@lib/prisma"

export const usersResolvers = {
  Query: {
    async users() {
      return await prisma.account.findMany()
    },
    hello: () => 'Hello',
    greet: (_: unknown, args: { name: string }) => `Hello, ${args.name}!`,
  }
}
