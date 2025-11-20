/**
 * Authentication page with login/register toggle
 */

import { useState } from 'react';
import { Login } from './Login';
import { Register } from './Register';

export const AuthPage = () => {
	const [showLogin, setShowLogin] = useState(true);

	const toggleForm = () => {
		setShowLogin(!showLogin);
	};

	return showLogin ? (
		<Login onToggleForm={toggleForm} />
	) : (
		<Register onToggleForm={toggleForm} />
	);
};
