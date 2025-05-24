import React from 'react';
import Button from './Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-danger-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 19c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h1 className="text-2xl font-bold text-secondary-900 mb-4">
                Oops! Something went wrong
              </h1>
              
              <p className="text-secondary-600 mb-6">
                We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
              </p>
              
              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Refresh Page
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                >
                  Go to Home
                </Button>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-secondary-500 mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="bg-secondary-50 rounded-lg p-3 text-xs text-secondary-700 font-mono overflow-auto max-h-32">
                    <div className="mb-2 font-semibold">Error:</div>
                    <div className="mb-2">{this.state.error.toString()}</div>
                    <div className="font-semibold">Stack Trace:</div>
                    <div className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</div>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
