import { SignIn } from '@stackframe/stack';

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Welcome back to Habibi Home
                    </p>
                </div>
                <SignIn
                    fullPage={false}
                    automaticRedirect={true}
                />
            </div>
        </div>
    );
}
