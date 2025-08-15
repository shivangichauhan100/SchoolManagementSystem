import Link from 'next/link'

export default function GetStartedPage() {
	return (
		<div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-16">
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
				<div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
			</div>
			<div className="max-w-3xl mx-auto">
				<h1 className="text-4xl font-bold text-gray-900 mb-4">Get started</h1>
				<p className="text-gray-600 mb-8">Follow these steps to start using the platform.</p>
				<ol className="list-decimal pl-6 space-y-4 text-gray-800">
					<li>Register an admin account or sign in if you already have one.</li>
					<li>Configure basic institute settings and academic year.</li>
					<li>Add teachers, students, and courses.</li>
					<li>Invite users and assign roles.</li>
					<li>Start tracking attendance and grades.</li>
				</ol>

				<div className="mt-8 flex gap-3">
					<Link href="/auth/login" className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 font-semibold text-white shadow hover:from-blue-500 hover:to-indigo-500">Login</Link>
					<Link href="/features" className="rounded-xl border border-blue-600 px-5 py-2.5 font-semibold text-blue-600 hover:bg-blue-50">Explore features</Link>
				</div>
			</div>
		</div>
	)
}


