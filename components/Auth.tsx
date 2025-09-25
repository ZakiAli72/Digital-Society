import React, { useState, useMemo } from 'react';
import { LogoIcon, UserCircleIcon, EmailIcon, LockIcon, SocietyIcon, HashtagIcon, CheckIcon, InfoCircleIcon, BackArrowIcon, SpinnerIcon, CalendarIcon } from './icons/Icons';
import { ThemeToggle } from './ThemeToggle';

interface AuthProps {
    onLogin: (email: string, password: string) => boolean;
    onRegister: (societyName: string, registrationNumber: string, email: string, password: string, registrationYear: number) => string | true;
    onForgotPassword: (email: string) => void;
    checkSocietyNameExists: (name: string) => boolean;
    checkRegistrationNumberExists: (regNo: string) => boolean;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onRegister, onForgotPassword, checkSocietyNameExists, checkRegistrationNumberExists }) => {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [societyName, setSocietyName] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [registrationYear, setRegistrationYear] = useState<string>(String(new Date().getFullYear()));
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [societyNameFeedback, setSocietyNameFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [regNumFeedback, setRegNumFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);

    const registrationYears = useMemo(() => 
        Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => new Date().getFullYear() - i)
    , []);

    const resetState = () => {
        setEmail('');
        setPassword('');
        setSocietyName('');
        setRegistrationNumber('');
        setRegistrationYear(String(new Date().getFullYear()));
        setError('');
        setSocietyNameFeedback(null);
        setRegNumFeedback(null);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Email and password are required.');
            return;
        }
        setIsLoading(true);
        const success = onLogin(email, password);
        if (!success) {
            setError('Invalid email or password. Please try again.');
        }
        setIsLoading(false);
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!societyName || !registrationNumber || !email || !password || !registrationYear) {
            setError('All fields are required.');
            return;
        }
        if (societyNameFeedback?.type === 'error' || regNumFeedback?.type === 'error') {
            setError('Please fix the errors before submitting.');
            return;
        }

        setIsLoading(true);
        const result = onRegister(societyName, registrationNumber, email, password, parseInt(registrationYear));
        if (result !== true) {
            setError(result);
            setIsLoading(false);
        }
    };

    const handleForgotPasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email) {
            setError('Please enter your email address.');
            return;
        }
        setIsLoading(true);
        onForgotPassword(email);
        setIsLoading(false);
        // Parent component will show a toast/modal
        handleBackToLogin();
    };
    
    const switchTab = (tab: 'login' | 'register') => {
        setActiveTab(tab);
        resetState();
    }
    
    const handleShowForgotPassword = () => {
        resetState();
        setShowForgotPassword(true);
    };

    const handleBackToLogin = () => {
        resetState();
        setShowForgotPassword(false);
        setActiveTab('login');
    };

    const handleSocietyNameBlur = () => {
        if (societyName.trim() === '') {
            setSocietyNameFeedback(null);
            return;
        }
        const exists = checkSocietyNameExists(societyName);
        if (exists) {
            setSocietyNameFeedback({ type: 'error', message: 'This society name is already registered.' });
        } else {
            setSocietyNameFeedback({ type: 'success', message: 'Society name is available!' });
        }
    };

    const handleRegNumBlur = () => {
        if (registrationNumber.trim() === '') {
            setRegNumFeedback(null);
            return;
        }
        const exists = checkRegistrationNumberExists(registrationNumber);
        if (exists) {
            setRegNumFeedback({ type: 'error', message: 'This registration number is already in use.' });
        } else {
            setRegNumFeedback({ type: 'success', message: 'Registration number is valid.' });
        }
    };

    const commonInputClass = "w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 placeholder:text-slate-400 dark:placeholder:text-slate-500";
    
    const titles: Record<'login' | 'register', {title: string, subtitle: string}> = {
        login: { title: "Welcome Back!", subtitle: "Sign in to manage your society"},
        register: { title: "Create Your Account", subtitle: "Register your society to get started"}
    };
    
    const forgotPasswordTitle = { title: "Reset Password", subtitle: "Enter your email to receive a reset link." };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col justify-center items-center p-4 relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <div className="max-w-md w-full mx-auto">
                <div className="flex justify-center items-center mb-6">
                    <LogoIcon />
                    <h1 className="text-3xl font-bold text-primary-700 dark:text-primary-500 ml-2">Digital Society</h1>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                    {!showForgotPassword ? (
                        <div className="flex border-b border-slate-200 dark:border-slate-700">
                            <button 
                                onClick={() => switchTab('login')} 
                                className={`w-1/2 p-4 text-center font-semibold rounded-tl-xl transition-colors ${activeTab === 'login' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                Login
                            </button>
                            <button 
                                onClick={() => switchTab('register')} 
                                className={`w-1/2 p-4 text-center font-semibold rounded-tr-xl transition-colors ${activeTab === 'register' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                Register
                            </button>
                        </div>
                    ) : (
                        <div className="p-4 text-center font-semibold text-primary-600 dark:text-primary-400 border-b border-slate-200 dark:border-slate-700 rounded-t-xl">
                           Forgot Password
                        </div>
                    )}
                    
                    <div className="p-8">
                        <div className="flex flex-col items-center text-center mb-6">
                            <UserCircleIcon className="h-16 w-16 text-slate-300 dark:text-slate-600" />
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">{!showForgotPassword ? titles[activeTab].title : forgotPasswordTitle.title}</h2>
                            <p className="text-slate-500 dark:text-slate-400">{!showForgotPassword ? titles[activeTab].subtitle : forgotPasswordTitle.subtitle}</p>
                        </div>
                        
                        {error && (
                            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-md relative mb-4" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                        
                        {!showForgotPassword ? (
                           <>
                            {activeTab === 'login' ? (
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><EmailIcon /></span>
                                        <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className={commonInputClass} aria-label="Email Address" autoComplete="email" autoFocus />
                                    </div>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockIcon /></span>
                                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={commonInputClass} aria-label="Password" autoComplete="current-password" />
                                    </div>
                                    <div className="text-right -mt-2 mb-2">
                                        <button type="button" onClick={handleShowForgotPassword} className="text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
                                            Forgot Password?
                                        </button>
                                    </div>
                                    <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 font-semibold disabled:bg-primary-400">
                                        {isLoading ? <SpinnerIcon /> : 'Login'}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SocietyIcon /></span>
                                            <input type="text" placeholder="Society Name" value={societyName} 
                                                onChange={(e) => {
                                                    setSocietyName(e.target.value);
                                                    if (societyNameFeedback) setSocietyNameFeedback(null);
                                                }} 
                                                onBlur={handleSocietyNameBlur}
                                                className={commonInputClass} aria-label="Society Name" autoFocus/>
                                        </div>
                                        {societyNameFeedback && (
                                            <div className={`text-xs mt-1.5 flex items-center ${societyNameFeedback.type === 'success' ? 'text-green-600 dark:text-green-500' : 'text-red-500 dark:text-red-400'}`}>
                                                {societyNameFeedback.type === 'success' ? <CheckIcon /> : <InfoCircleIcon />}
                                                <span className="ml-1.5">{societyNameFeedback.message}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><HashtagIcon /></span>
                                                <input type="text" placeholder="Reg. Number" value={registrationNumber} 
                                                    onChange={(e) => {
                                                        setRegistrationNumber(e.target.value);
                                                        if (regNumFeedback) setRegNumFeedback(null);
                                                    }}
                                                    onBlur={handleRegNumBlur}
                                                    className={commonInputClass} aria-label="Registration Number" />
                                            </div>
                                            {regNumFeedback && (
                                                <div className={`text-xs mt-1.5 flex items-center ${regNumFeedback.type === 'success' ? 'text-green-600 dark:text-green-500' : 'text-red-500 dark:text-red-400'}`}>
                                                    {regNumFeedback.type === 'success' ? <CheckIcon /> : <InfoCircleIcon />}
                                                    <span className="ml-1.5">{regNumFeedback.message}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><CalendarIcon/></span>
                                            <select 
                                                value={registrationYear} 
                                                onChange={e => setRegistrationYear(e.target.value)} 
                                                className={commonInputClass}
                                                aria-label="Year of Registration"
                                            >
                                                {registrationYears.map(year => <option key={year} value={year}>{year}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><EmailIcon /></span>
                                            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className={commonInputClass} aria-label="Email Address" autoComplete="email" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockIcon /></span>
                                            <input type="password" placeholder="Create Password" value={password} onChange={(e) => setPassword(e.target.value)} className={commonInputClass} aria-label="Password" autoComplete="new-password" />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 font-semibold !mt-6 disabled:bg-primary-400">
                                        {isLoading ? <SpinnerIcon /> : 'Register'}
                                    </button>
                                </form>
                            )}
                           </>
                        ) : (
                             <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3"><EmailIcon /></span>
                                    <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className={commonInputClass} aria-label="Email Address" autoComplete="email" autoFocus />
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 font-semibold !mt-6 disabled:bg-primary-400 dark:disabled:bg-primary-800">
                                    {isLoading ? <SpinnerIcon /> : 'Send Reset Link'}
                                </button>
                                <div className="text-center">
                                    <button type="button" onClick={handleBackToLogin} className="text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center">
                                        <BackArrowIcon />
                                        <span className="ml-1">Back to Login</span>
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2 max-w-md w-full">
                <div className="p-2 bg-slate-200/50 dark:bg-slate-700/50 rounded-md text-left flex items-start gap-2">
                    <InfoCircleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">All data is stored locally in your browser. Clearing site data will erase everything. Use the <strong>Backup & Restore</strong> feature to save your data externally.</span>
                </div>
                <p className="!mt-4">&copy; 2025 Digital Society Management</p>
            </div>
        </div>
    );
};