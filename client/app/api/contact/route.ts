export async function POST(req: Request) {
	try {
		const body = await req.json().catch(() => ({})) as any
		// Here you could forward to a backend or email service
		return new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	} catch {
		return new Response(JSON.stringify({ ok: false }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}


