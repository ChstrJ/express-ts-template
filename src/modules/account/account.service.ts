import { accountRepository } from "./account.repository";

export const userService = {
    async findAll() {
        // fetch users from db
        return [{ id: 1, name: 'Alice' }];
    },

    async findOne(id: number) {
        // fetch a single user
        return { id, name: 'Alice' };
    },

    async create(data: { name: string }) {
        // save new user
        return { id: Date.now(), ...data };
    },

    async update(id: number, data: { name?: string }) {
        // update user
        return { id, ...data };
    },

    async remove(id: number) {
        // delete user
        return { success: true, id };
    },
};
