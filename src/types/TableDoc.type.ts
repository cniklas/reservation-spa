export type Timestamp = {
	seconds: number
	nanoseconds: number
}

export type SeatKey = 'seat_1' | 'seat_2' | 'seat_3' | 'seat_4' | 'seat_5' | 'seat_6' | 'seat_7' | 'seat_8'
export type TableDoc = {
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
