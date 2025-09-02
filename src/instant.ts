import { init } from '@instantdb/core'
import schema from './instant.schema'

export const instant = init({
	appId: import.meta.env.VITE_INSTANT_APP_ID,
	schema,
	// when true, all date columns in queries will return a Javascript Date object
	// useDateObjects: true,
	devtool: false,
})
