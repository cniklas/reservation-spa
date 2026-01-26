import { init } from '@instantdb/admin'

const db = init({
	appId: process.env.VITE_INSTANT_APP_ID as string,
	adminToken: process.env.VITE_INSTANT_ADMIN_TOKEN,
})

function returnError(message: string, status: number) {
	const response = new Response(JSON.stringify({ error: message }), { status })
	response.headers.set('Content-Type', 'application/json')
	return response
}

export default async (request: Request) => {
	try {
		const { email } = await request.json()
		if (!email) {
			return returnError('E-Mail-Adresse fehlt', 400)
		}

		const { auth_users } = await db.query({ auth_users: { $: { where: { email } } } })
		if (auth_users.length === 0) {
			// alternative: silently ignore unknown emails or respond positively
			return returnError('E-Mail-Adresse unbekannt', 401)
		}

		await db.auth.sendMagicCode(email)
		return new Response(null, { status: 204 })
	} catch {
		return returnError('Serverfehler', 500)
	}
}
