import type { InstaQLEntity } from '@instantdb/core'
import type { AppSchema } from '@/instant.schema'

export type SeatKey = 'seat_1' | 'seat_2' | 'seat_3' | 'seat_4' | 'seat_5' | 'seat_6' | 'seat_7' | 'seat_8'

export type Table = InstaQLEntity<AppSchema, 'tables', object, undefined, true>

export type CreateTable = Omit<Table, 'id' | 'locked_at' | 'locked_by'>

export type LockedTable = Pick<Table, 'locked_at' | 'locked_by'>
