import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { usePreview } from "../auth/AuthProvider";
import { Feedback } from "./ui";
import { ApiError } from "../api/client";
import { Link } from "react-router-dom";
export function ResourceState<T>({
  query,
  children,
}: {
  query: UseQueryResult<T, Error>;
  children: ReactNode;
}) {
  const preview = usePreview();
  if (preview) return children;
  if (query.isPending)
    return <Feedback kind="loading" title="Loading your organization data" />;
  if (query.isError && !query.data)
    return (
      <Feedback
        kind="error"
        title={query.error.message}
        retry={() => void query.refetch()}
      >
        {query.error instanceof ApiError && query.error.status === 401 && (
          <Link to="/login">Sign in again</Link>
        )}
      </Feedback>
    );
  return children;
}
