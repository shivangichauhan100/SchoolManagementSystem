export default function BenefitsPage() {
	const benefits = [
		'Streamlined administrative processes',
		'Real-time data and analytics',
		'Improved communication between stakeholders',
		'Enhanced student performance tracking',
		'Automated reporting and notifications',
		'Mobile-friendly interface',
		'Secure and compliant data handling',
		'Scalable for any institution size',
	]

	return (
		<div className="relative min-h-screen bg-gradient-to-br from-violet-50 via-white to-sky-50 px-4 py-16">
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
				<div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
			</div>
			<div className="max-w-5xl mx-auto">
				<h1 className="text-4xl font-bold text-gray-900 mb-2">Benefits</h1>
				<p className="text-gray-600 mb-8">Why schools choose our platform.</p>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{benefits.map((b) => (
						<div key={b} className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-xl">
							<div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-100/60 blur-xl transition group-hover:bg-indigo-200/70" />
							<p className="text-gray-800">{b}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}


