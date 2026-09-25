import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request, ApiError } from "./client";
import { useAuth, usePreview } from "../auth/AuthProvider";
export function useResource<T>(path: string, refresh = false, enabled = true) {
  const preview = usePreview();
  const { session } = useAuth();
  return useQuery({
    queryKey: [path, session?.user.id],
    queryFn: ({ signal }) => request<T>(path, { signal }),
    enabled: enabled && !!session && !preview,
    refetchInterval: refresh ? 30000 : false,
    retry: (count, error) =>
      !(error instanceof ApiError && [401, 403, 404].includes(error.status)) &&
      count < 1,
  });
}
export function useAction<T = unknown>(path: string, method = "POST") {
  const cache = useQueryClient();
  const preview = usePreview();
  return useMutation({
    mutationFn: (data: unknown) => {
      if (preview)
        throw new ApiError(
          "Design review is read-only. Connect the backend to save changes.",
        );
      return request<T>(path, {
        method,
        body: data === undefined ? undefined : JSON.stringify(data),
      });
    },
    onSuccess: () => cache.invalidateQueries(),
  });
}
