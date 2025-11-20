/**
 * Register component
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface RegisterProps {
	onToggleForm: () => void;
}

export const Register = ({ onToggleForm }: RegisterProps) => {
	const [email, setEmail] = useState('');
	const [username, setUsername] = useState('');
	const [fullName, setFullName] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const { register } = useAuth();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		// Validation
		if (password !== confirmPassword) {
			setError('Passwords do not match');
			return;
		}

		if (password.length < 8) {
			setError('Password must be at least 8 characters');
			return;
		}

		setIsLoading(true);

		try {
			await register({
				email,
				username,
				password,
				full_name: fullName || undefined,
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Registration failed');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
			<div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
					<p className="text-gray-600">Sign up to get started</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-5">
					{error && (
						<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
							{error}
						</div>
					)}

					<div>
						<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
							Email *
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
						/>
					</div>

					<div>
						<label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
							Username *
						</label>
						<input
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
							minLength={3}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
						/>
					</div>

					<div>
						<label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
							Full Name
						</label>
						<input
							id="fullName"
							type="text"
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
						/>
					</div>

					<div>
						<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
							Password *
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={8}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
							placeholder="Minimum 8 characters"
						/>
					</div>

					<div>
						<label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
							Confirm Password *
						</label>
						<input
							id="confirmPassword"
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							minLength={8}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
							placeholder="Confirm password"
						/>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
					>
						{isLoading ? 'Creating account...' : 'Sign Up'}
					</button>
				</form>

				<div className="mt-6 text-center">
					<p className="text-sm text-gray-600">
						Already have an account?{' '}
						<button
							onClick={onToggleForm}
							className="text-blue-600 hover:text-blue-700 font-medium"
						>
							Sign in
						</button>
					</p>
				</div>
			</div>
		</div>
	);
};
