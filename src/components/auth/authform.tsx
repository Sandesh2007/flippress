'use client'

import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, X } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/database"
import ForgotPassword from "./forgot-password";
import google_logo from "../../../public/google_logo.svg";

export default function AuthForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode");
    const [isLoading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(mode === "login");
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const supabase = createBrowserClient();
    const next = searchParams.get('next');
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        // Clear error when user starts typing
        if (error) setError('');
    };

    const validateForm = () => {
        // Basic field validation
        if (!isLogin && (!formData.email || !formData.password || !formData.username)) {
            setError("Please fill in all fields");
            return false;
        }

        if (isLogin && (!formData.email || !formData.password)) {
            setError("Please fill in all fields");
            return false;
        }

        // Username validation (only for signup)
        if (!isLogin) {
            if (!/^[a-z0-9_\s]+$/.test(formData.username)) {
                setError('Username can only contain numbers, underscores, and spaces.');
                return false;
            }

            if (formData.username.length < 3) {
                setError('Username must be at least 3 characters long.');
                return false;
            }
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address.');
            return false;
        }

        // Password validation
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return false;
        }

        // Terms validation (only for signup)
        if (!isLogin && !agreedToTerms) {
            setError("Please agree to the Terms & Conditions");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isLoading || isTransitioning) return;

        // Clear previous errors
        setError('');

        // Validate form
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const { email, password, username } = formData;

            // Check for existing username/email only for signup
            if (!isLogin) {
                // Check if username exists
                const { data: usernameData, error: usernameError } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("username", username)
                    .single();

                if (usernameError && usernameError.code !== 'PGRST116') {
                    // PGRST116 is "not found" which is what we want
                    setError(`Database error: ${usernameError.message}`);
                    return;
                }

                if (usernameData) {
                    setError("Username is already taken.");
                    return;
                }

                // Check if email exists
                const { data: emailData, error: emailError } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("email", email)
                    .single();

                if (emailError && emailError.code !== 'PGRST116') {
                    setError(`Database error: ${emailError.message}`);
                    return;
                }

                if (emailData) {
                    setError("Email is already registered.");
                    return;
                }
            }

            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) {
                    setError(error.message);
                    return;
                }
                toast.success('Login successful!');
                router.replace(next || '/home/publisher');
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: username,
                            email: email,
                        }
                    }
                });

                if (error) {
                    toast.custom(
                        (t) => (
                            <div
                                className={`${t.visible ? "animate-enter" : "animate-leave"
                                    } max-w-sm w-full bg-red-500 text-white px-4 py-3 rounded shadow-lg flex flex-col gap-2`}
                            >
                                <div>
                                    <p className="text-sm whitespace-pre-line text-wrap break-words">{error.message}</p>
                                </div>
                                <div className="flex justify-end">
                                    <Button variant="outline" onClick={() => toast.dismiss(t.id)}>
                                        <X size={16} />
                                    </Button>
                                </div>
                            </div>
                        ),
                        { duration: 5000 }
                    );
                    return;
                } else {
                    toast.success("Signup successful! Please check your email to verify.");
                    setTimeout(() => {
                        router.replace(next || '/home/publisher');
                    }, 2000);
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
            setError(errorMessage);
            console.error('Auth error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: "google" | "apple") => {
        if (isTransitioning || isLoading) return;

        setLoading(true);
        try {
            const { error, data } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    queryParams: {
                        access_type: "offline",
                        prompt: "consent",
                    },
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });
            if (error) {
                setError(error.message);
                return;
            }
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            setError("An error occurred during social login");
            console.error('Social login error:', err);
        } finally {
            setLoading(false);
        }
    };

    const switchMode = () => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        setError(''); // Clear errors when switching modes

        setTimeout(() => {
            setIsLogin(!isLogin);
            setFormData({ username: "", email: "", password: "" });
            setAgreedToTerms(false);
            setShowPassword(false);

            setTimeout(() => {
                setIsTransitioning(false);
            }, 300);
        }, 150);
    };

    return (
        <div className="h-fit rounded-4xl flex items-center justify-center p-4">
            <div className="w-full max-w-6xl glass rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[600px]">
                {/* Left Panel - Image (Hidden on mobile, shown on lg+) */}
                <div className="hidden lg:flex lg:w-1/2 relative">
                    <div className="w-full h-full glass flex flex-col justify-between p-6 xl:p-8 relative overflow-hidden">
                        {/* Mountain silhouette background */}
                        <div className="absolute inset-0">
                            <svg viewBox="0 0 400 500" className="w-full h-full fill-primary/30">
                                <path
                                    d="M0,400 Q100,200 200,300 Q300,150 400,250 L400,600 L0,600 Z"
                                    fill=""
                                />
                                <path
                                    d="M0,450 Q150,250 250,350 Q350,200 400,300 L400,600 L0,600 Z"
                                    fill=""
                                />
                            </svg>
                        </div>

                        {/* Logo and back button */}
                        <div className="relative z-10">
                            <Link href="/">
                                <Button variant="ghost" className="text-muted-foreground transition-colors flex items-center gap-2 mb-6 xl:mb-8 text-sm xl:text-base hover:text-foreground cursor-pointer">
                                    <ArrowLeft size={18} />
                                    <span>Back to website</span>
                                </Button>
                            </Link>
                            <div className="text-foreground text-2xl xl:text-3xl font-bold">Flip Press</div>
                        </div>

                        {/* Main content */}
                        <div className="relative z-10 text-neutral-50 dark:text-neutral-50">
                            <h2 className="text-3xl xl:text-4xl font-bold mb-4 leading-tight">
                                Create beautiful flipbooks,<br />
                                Creating Memories
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div className="w-full lg:w-1/2 p-6 sm:p-8 lg:p-10 xl:p-12 flex items-center dark:bg-neutral-900">
                    <div className="max-w-md mx-auto w-full">
                        {/* Mobile logo */}
                        <div className="lg:hidden text-foreground text-2xl font-bold mb-8 text-center">Flip Press</div>

                        {/* Form Header with Enhanced Animation */}
                        <div className="relative overflow-hidden mb-8 h-20">
                            <div
                                className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${isLogin && !isTransitioning
                                    ? 'translate-x-0 opacity-100'
                                    : isTransitioning && isLogin
                                        ? 'translate-x-[-50%] opacity-0 scale-95'
                                        : 'translate-x-full opacity-0 scale-95'
                                    }`}
                            >
                                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Welcome back</h1>
                                <p className="text-muted-foreground">
                                    Don&apos;t have an account?{" "}
                                    <button
                                        type="button"
                                        onClick={switchMode}
                                        disabled={isTransitioning}
                                        className="text-accent-foreground hover:text-neutral-600 transition-colors underline disabled:opacity-50"
                                    >
                                        Sign up
                                    </button>
                                </p>
                            </div>

                            <div
                                className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${!isLogin && !isTransitioning
                                    ? 'translate-x-0 opacity-100'
                                    : isTransitioning && !isLogin
                                        ? 'translate-x-[50%] opacity-0 scale-95'
                                        : 'translate-x-[-100%] opacity-0 scale-95'
                                    }`}
                            >
                                <h1 className="text-2xl sm:text-2xl font-bold text-foreground mb-2">Create an account</h1>
                                <p className="text-muted-foreground">
                                    Already have an account?{" "}
                                    <button
                                        type="button"
                                        onClick={switchMode}
                                        disabled={isTransitioning}
                                        className="text-accent-foreground hover:text-neutral-600 transition-colors underline disabled:opacity-50"
                                    >
                                        Log in
                                    </button>
                                </p>
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Form with Enhanced Animation */}
                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                            {/* Username field - Only for signup */}
                            <div
                                className={`transition-all duration-600 ease-in-out overflow-hidden ${!isLogin ? 'opacity-100 transform' : 'max-h-0 opacity-0 transform'
                                    }`}
                            >
                                <input
                                    type="text"
                                    name="username"
                                    required={!isLogin}
                                    placeholder="Username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 glass border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all duration-300 text-sm sm:text-base"
                                    disabled={isTransitioning || isLoading}
                                    autoComplete="username"
                                />
                            </div>


                            {/* Email field */}
                            <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 glass border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all duration-300 text-sm sm:text-base"
                                    required
                                    disabled={isTransitioning || isLoading}
                                    autoComplete="email"
                                />
                            </div>

                            {/* Password field */}
                            <div className={`relative transition-all duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder={isLogin ? "Password" : "Enter your password"}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 glass border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all duration-300 text-sm sm:text-base"
                                    required
                                    disabled={isTransitioning || isLoading}
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isTransitioning || isLoading}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Forgot password - Only for login */}
                            <div
                                className={`transition-all duration-600 flex justify-end ease-in-out overflow-hidden ${isLogin
                                    ? 'max-h-12 opacity-100 transform translate-y-0'
                                    : 'max-h-0 opacity-0 transform -translate-y-2'
                                    }`}
                            >
                                <div className="glass w-fit rounded-md">
                                    <ForgotPassword />
                                </div>
                            </div>

                            {/* Terms checkbox - Only for signup */}
                            <div
                                className={`transition-all duration-600 ease-in-out overflow-hidden ${!isLogin
                                    ? 'max-h-20 opacity-100 transform translate-y-0'
                                    : 'max-h-0 opacity-0 transform -translate-y-2'
                                    }`}
                            >
                                <div className="flex items-start gap-3 pb-1">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="mt-1 w-4 h-4 text-accent glass border-border rounded"
                                        required={!isLogin}
                                        disabled={isTransitioning || isLoading}
                                    />
                                    <label htmlFor="terms" className="text-xs sm:text-sm text-muted-foreground">
                                        I agree to the{" "}
                                        <button
                                            type="button"
                                            className="text-accent-foreground hover:text-neutral-600 transition-colors underline"
                                            disabled={isTransitioning || isLoading}
                                        >
                                            Terms & Conditions
                                        </button>
                                    </label>
                                </div>
                            </div>

                            {/* Submit button */}
                            <button
                                type="submit"
                                className={`w-full py-2.5 sm:py-3 bg-primary text-primary-foreground cursor-pointer font-semibold rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2
                                    focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all duration-300
                                    transform hover:scale-[1.02] text-sm sm:text-base ${(isLoading || isTransitioning) ? 'opacity-50 cursor-not-allowed scale-100' : ''
                                    }`}
                                disabled={isLoading || isTransitioning}
                            >
                                {isLoading ? 'Loading...' : (isLogin ? 'Log in' : 'Create account')}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className={`relative mt-6 transition-all duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border bg-neutral-500"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white/40 border-none dark:bg-neutral-900 text-muted-foreground">
                                    Or {isLogin ? 'log in' : 'register'} with
                                </span>
                            </div>
                        </div>

                        {/* Social login buttons */}
                        <div className={`flex sm:gap-4 mt-6 transition-all duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
                            <button
                                type="button"
                                onClick={() => handleSocialLogin("google")}
                                disabled={isTransitioning || isLoading}
                                className="flex items-center w-full justify-center gap-2 py-2.5 sm:py-3 px-4 glass cursor-pointer border border-border rounded-lg
                                text-foreground hover:bg-muted/80
                                focus:outline-none focus:ring-2 focus:ring-muted transition-colors text-sm sm:text-base disabled:opacity-50
                                disabled:cursor-not-allowed"
                            >
                                <img
                                width={22}
                                src={google_logo.src}
                                />
                                <span>Google</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
