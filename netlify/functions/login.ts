import { init } from '@instantdb/admin'

const db = init({
	appId: process.env.VITE_INSTANT_APP_ID as string,
	adminToken: process.env.VITE_INSTANT_ADMIN_TOKEN,
})

function returnError(message: string, status: number) {
	const res = new Response(JSON.stringify({ error: message }), { status })
	res.headers.set('Content-Type', 'application/json')
	return res
}

export default async (req: Request) => {
	try {
		const { email } = await req.json()
		if (!email) {
			return returnError('E-Mail-Adresse fehlt', 400)
		}

		const { allowed_users } = await db.query({ allowed_users: { $: { where: { email } } } })
		if (!allowed_users.some(user => user.email === email)) {
			// alternative: silently ignore unknown emails or respond positively
			return returnError('E-Mail-Adresse nicht zugelassen', 401)
		}

		await db.auth.sendMagicCode(email)
		return new Response(null, { status: 204 })
	} catch {
		return returnError('Serverfehler', 500)
	}
}
