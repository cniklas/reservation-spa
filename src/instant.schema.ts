// Docs: https://www.instantdb.com/docs/modeling-data
import { i } from '@instantdb/core'

const _schema = i.schema({
	entities: {
		$files: i.entity({
			path: i.string().unique().indexed(),
			url: i.string().optional(),
		}),
		$users: i.entity({
			email: i.string().unique().indexed().optional(),
		}),
		tables: i.entity({
			active: i.boolean(),
			index: i.number().unique().indexed(),
			locked_at: i.any().optional(),
			locked_by: i.string().optional(),
			name: i.string(),
			seat_1: i.string(),
			seat_2: i.string(),
			seat_3: i.string(),
			seat_4: i.string(),
			seat_5: i.string(),
			seat_6: i.string(),
			seat_7: i.string(),
			seat_8: i.string(),
			seats: i.number(),
		}),
	},
	links: {},
	rooms: {},
})

// this helps Typescript display nicer intellisense
type _AppSchema = typeof _schema
type AppSchema = _AppSchema
const schema: AppSchema = _schema

export type { AppSchema }
export default schema
