import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Button from '../components/common/Button';

export default function NotFound() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200">404</h1>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to={isAuthenticated ? '/dashboard' : '/'}>
            <Button>
              {isAuthenticated ? 'Go to Dashboard' : 'Go to Home'}
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="text-sky-600 hover:text-sky-700 font-medium"
          >
            Go Back
          </button>
        </div>

        {/* Help Link */}
        <p className="mt-8 text-sm text-gray-500">
          Need help?{' '}
          <a href="mailto:support@example.com" className="text-sky-600 hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}