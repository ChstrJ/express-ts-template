import { GeneralMessage } from "@common/constants/message";
import { AlreadyExistsException, NotFoundException } from "@utils/errors";

export abstract class BaseRepository<T> {
  protected prisma: PrismaClient = new PrismaClient();
  protected model: any;

  async findAll(): Promise<T[]> {
    return await this.model.findMany();
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findUnique({ id });
  }

  async findOrFail(id: string) {
    const data = await this.findById(id);

    if (!data) {
      throw new NotFoundException(GeneralMessage.NOT_FOUND)
    }

    return data;
  }

  async create(data: Partial<T>) {
    try {
      return await this.model.create({
        data,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new AlreadyExistsException(GeneralMessage.ALREADY_EXISTS);
      }
      throw e;
    }
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    await this.findOrFail(id);

    return await this.model.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<T> {
    await this.findOrFail(id);

    return await this.model.delete({
      where: { id },
    });
  }

  async findMany(where: Partial<T>, options: object = {}): Promise<T[]> {
    return await this.model.findMany({ where, ...options });
  }

  async findFirst(where: Partial<T>, options: object = {}): Promise<T | null> {
    return await this.model.findFirst({ where, ...options });
  }

  async updateMany(where: Partial<T>, data: Partial<T>): Promise<{ count: number }> {
    return await this.model.updateMany({
      where,
      data,
    });
  }

  async createMany(data: Partial<T>): Promise<T[]> {
    return await this.model.createMany({
      data,
    });
  }

  async deleteMany(where: Partial<T>): Promise<{ count: number }> {
    return await this.model.deleteMany({
      where,
    });
  }

  async count(where: Partial<T> = {}): Promise<number> {
    return await this.model.count({
      where,
    });
  }

  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    where: Partial<T> = {}
  ): Promise<{ data: T[]; total: number; page: number; pageSize: number }> {
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
