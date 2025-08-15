'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const loginSchema = z.object({
	email: z.string().min(1, 'Email is required').email('Enter a valid email'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
	const router = useRouter()
	const [serverError, setServerError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginValues>({
		resolver: zodResolver(loginSchema),
	})

	const onSubmit = async (values: LoginValues) => {
		try {
			setServerError(null)
			setLoading(true)
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(values),
			})

			if (!res.ok) {
				const data = await res.json().catch(() => ({}))
				throw new Error(data?.message || 'Invalid credentials')
			}

			const data = await res.json().catch(() => ({}))
			if (data?.token) {
				localStorage.setItem('sms_auth_token', data.token)
			}
			// Best-effort: navigate to home (or a dashboard if added later)
			router.push('/')
		} catch (err: any) {
			setServerError(err?.message || 'Login failed')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50">
			{/* Decorative background */}
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
				<div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
			</div>

			<div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-stretch gap-8 px-4 py-12 md:py-16 lg:grid-cols-2 lg:py-24">
				{/* Left panel */}
				<div className="relative hidden overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-2xl lg:block">
					<div className="relative z-10">
						<h2 className="text-3xl font-bold leading-tight md:text-4xl">Shivangi Chauhan Institute of Management Studies</h2>
						<p className="mt-4 text-blue-100">Sign in to access your dashboard, manage courses, track attendance, and more.</p>
						<ul className="mt-8 space-y-3 text-blue-100/90">
							<li className="flex items-center gap-2"><span className="inline-block h-1.5 w-1.5 rounded-full bg-white" /> Secure role-based access</li>
							<li className="flex items-center gap-2"><span className="inline-block h-1.5 w-1.5 rounded-full bg-white" /> Real-time analytics</li>
							<li className="flex items-center gap-2"><span className="inline-block h-1.5 w-1.5 rounded-full bg-white" /> Fast, modern interface</li>
						</ul>
					</div>
					<div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
					<div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
				</div>

				{/* Form card */}
				<div className="w-full lg:max-w-md lg:justify-self-end">
					<div className="rounded-2xl border border-gray-100 bg-white/80 p-8 shadow-xl backdrop-blur-sm">
						<div className="mb-6 text-center">
							<h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
							<p className="mt-1 text-gray-600">Sign in to your account</p>
						</div>

						<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
							<div>
								<label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
								<input
									type="email"
									className="w-full rounded-xl border border-gray-300 px-3 py-2.5 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="you@example.com"
									{...register('email')}
								/>
								{errors.email && (
									<p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
								)}
							</div>

							<div>
								<label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
								<input
									type="password"
									className="w-full rounded-xl border border-gray-300 px-3 py-2.5 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="********"
									{...register('password')}
								/>
								{errors.password && (
									<p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
								)}
							</div>

							{serverError && (
								<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
									{serverError}
								</div>
							)}

							<button
								type="submit"
								disabled={loading}
								className="relative w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 font-semibold text-white shadow-lg transition hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60"
							>
								<span className="relative z-10">{loading ? 'Signing in...' : 'Sign in'}</span>
								<span className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
							</button>
						</form>

						<div className="mt-6 text-center text-sm text-gray-600">
							<span>Don&apos;t have an account? </span>
							<Link href="/get-started" className="text-blue-600 hover:underline">Get started</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}


