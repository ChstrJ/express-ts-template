import { GeneralMessage } from "@common/constants/message";
import { Prisma } from "@prisma/client";
import { AlreadyExistsException, NotFoundException } from "@utils/errors";

export abstract class BaseRepository {
  protected abstract model: any;

  async findAll() {
    return await this.model.findMany();
  }

  async findById(id: string) {
    return await this.model.findUnique({ id });
  }

  async findOrFail(id: string) {
    const data = await this.findById(id);

    if (!data) {
      throw new NotFoundException(GeneralMessage.NOT_FOUND)
    }

    return data;
  }

  async create(data: any) {
    try {
      return await this.model.create({
        data: data
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new AlreadyExistsException(GeneralMessage.ALREADY_EXISTS);
      }
      throw e;
    }
  }

  async update(id: string, data: any) {
    await this.findOrFail(id);

    return await this.model.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findOrFail(id);

    return await this.model.delete({
      where: { id },
    });
  }

  async findMany(where: any, options: object = {}) {
    return await this.model.findMany({ where, ...options });
  }

  async findFirst(where: any, options: object = {}) {
    return await this.model.findFirst({ where, ...options });
  }

  async updateMany(where: any, data: any): Promise<{ count: number }> {
    return await this.model.updateMany({
      where,
      data,
    });
  }

  async createMany(data: any) {
    return await this.model.createMany({
      data,
    });
  }

  async deleteMany(where: any) {
    return await this.model.deleteMany({
      where,
    });
  }

  async count(where: any = {}) {
    return await this.model.count({
      where,
    });
  }

  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    where: any = {}
  ) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
      }),
      this.model.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize: limit,
    };
  }
}
