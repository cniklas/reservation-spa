import type { InstaQLEntity } from '@instantdb/core'
import type { AppSchema } from '@/instant.schema'

export type SeatKey = `seat_${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`

export type Table = InstaQLEntity<AppSchema, 'tables', object, undefined, true>

export type CreateTable = Omit<Table, 'id' | 'locked_at' | 'locked_by'>

export type LockedTable = Pick<Table, 'locked_at' | 'locked_by'>
