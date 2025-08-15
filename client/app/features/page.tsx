import { 
	Users, GraduationCap, BookOpen, Clock, BarChart3, Shield,
} from 'lucide-react'

const features = [
	{ icon: Users, title: 'Student Management', description: 'Profiles, enrollment, and records.' },
	{ icon: GraduationCap, title: 'Teacher Management', description: 'Assignments and performance.' },
	{ icon: BookOpen, title: 'Course Management', description: 'Curriculum and scheduling.' },
	{ icon: Clock, title: 'Attendance', description: 'Real-time tracking and reports.' },
	{ icon: BarChart3, title: 'Grades', description: 'Submission and analytics.' },
	{ icon: Shield, title: 'Security', description: 'Role-based access control.' },
]

export default function FeaturesPage() {
	return (
		<div className="relative min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-4 py-16">
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
				<div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
			</div>
			<div className="max-w-6xl mx-auto">
				<h1 className="text-4xl font-bold text-gray-900 mb-2">Features</h1>
				<p className="text-gray-600 mb-10">Everything you need to manage your institution.</p>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{features.map((f) => (
						<div key={f.title} className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-xl">
							<div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-100/60 blur-xl transition group-hover:bg-blue-200/70" />
							<div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
								<f.icon className="h-5 w-5" />
							</div>
							<h3 className="text-xl font-semibold text-gray-900">{f.title}</h3>
							<p className="text-gray-600 mt-2">{f.description}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}


