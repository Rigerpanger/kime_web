
import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("3D Scene Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-full w-full items-center justify-center bg-black text-white p-8 border border-red-500/30 rounded-lg">
                    <div className="text-center">
                        <h3 className="text-xl font-bold mb-2 text-red-400">3D Scene Error</h3>
                        <p className="text-sm text-gray-400 mb-4">Something went wrong in the 3D world.</p>
                        <pre className="text-xs bg-gray-900 p-4 rounded text-left overflow-auto max-w-lg mx-auto">
                            {this.state.error && this.state.error.toString()}
                        </pre>
                        <button
                            className="mt-4 px-4 py-2 bg-white text-black text-sm font-bold rounded hover:bg-gray-200"
                            onClick={() => this.setState({ hasError: false })}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
