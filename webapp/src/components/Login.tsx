/**
 * Login component
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
	onToggleForm: () => void;
}

export const Login = ({ onToggleForm }: LoginProps) => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const { login } = useAuth();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);

		try {
			await login({ username, password });
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login failed');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
			<div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
					<p className="text-gray-600">Sign in to your account</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					{error && (
						<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
							{error}
						</div>
					)}

					<div>
						<label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
							Username or Email
						</label>
						<input
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
							placeholder="Enter your username"
						/>
					</div>

					<div>
						<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
							Password
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
							placeholder="Enter your password"
						/>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
					>
						{isLoading ? 'Signing in...' : 'Sign In'}
					</button>
				</form>

				<div className="mt-6 text-center">
					<p className="text-sm text-gray-600">
						Don't have an account?{' '}
						<button
							onClick={onToggleForm}
							className="text-blue-600 hover:text-blue-700 font-medium"
						>
							Sign up
						</button>
					</p>
				</div>
			</div>
		</div>
	);
};
