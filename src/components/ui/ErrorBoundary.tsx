"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.componentName ?? "Unknown"}]`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-center">
          <AlertTriangle size={32} className="text-red-500 mb-3" />
          <h3 className="text-sm font-bold text-red-700 dark:text-red-300 mb-1">
            {this.props.componentName ?? "Component"} Failed to Load
          </h3>
          <p className="text-xs text-red-500 dark:text-red-400 mb-3 max-w-sm">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer transition"
          >
            <RefreshCw size={12} />
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
