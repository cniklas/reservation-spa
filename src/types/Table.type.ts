export type SeatKey = 'seat_1' | 'seat_2' | 'seat_3' | 'seat_4' | 'seat_5' | 'seat_6' | 'seat_7' | 'seat_8'

export type Table = {
	active: boolean
	id: number
	index: number
	name: string
	locked_at: number | null
	locked_by: string | null
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

export type CreateTable = Omit<Table, 'id' | 'locked_at' | 'locked_by'>

export type LockedTable = Pick<Table, 'locked_at' | 'locked_by'>
