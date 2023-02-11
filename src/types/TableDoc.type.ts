export type Timestamp = {
	seconds: number
	nanoseconds: number
}

export type TableDoc = {
	[index: string]: boolean | number | string | undefined | Timestamp
	active: boolean
	block_id: number
	id: string
	index: number
	name: string
	locked_by?: string
	locked_at?: Timestamp
	modified: Timestamp
	seat_1: string
	seat_2: string
	seat_3: string
	seat_4: string
	seat_5: string
	seat_6: string
	seat_7: string
	seat_8: string
	seats: number
}
