import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 border border-[#f5c6cb] rounded-xl bg-[#fff3f3] text-[#721c24]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[#d32f2f] shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-[#721c24]">
                {this.props.fallbackTitle || "Unable to display this section"}
              </h3>
              <p className="text-xs text-[#856404] mt-1">
                {this.state.error?.message || "An unexpected error occurred during rendering."}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
