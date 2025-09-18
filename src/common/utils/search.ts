import { ExpressionBuilder, sql } from 'kysely';
import { QueryParams } from './pagination';

export const applySearch = (
    baseQuery: any,
    q: QueryParams,
    table: string,
    columns: string[]
) => {
    if (q.q && columns.length) {
        return baseQuery.where((eb: ExpressionBuilder<any, any>) =>
            eb.or(
                columns.map((column) =>
                    eb(sql`${sql.ref(table)}.${sql.ref(column)}`, 'like', `%${q.q}%`)
                )
            )
        );
    }

    return baseQuery;
};