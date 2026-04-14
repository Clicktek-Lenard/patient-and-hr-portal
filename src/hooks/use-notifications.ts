"use client";

import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotificationStore } from "@/store/notification-store";
import type { AppNotification } from "@/types";

async function fetchNotifications(): Promise<AppNotification[]> {
  const response = await fetch("/api/notifications");
  if (!response.ok) throw new Error("Failed to fetch notifications");
  const json = await response.json();
  return json.data as AppNotification[];
}

async function markNotificationRead(id: string): Promise<void> {
  const response = await fetch(`/api/notifications/${id}/read`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to mark notification as read");
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const {
    notifications,
    unreadCount,
    isLoading: storeLoading,
    setNotifications,
    markAsRead,
    setLoading,
  } = useNotificationStore();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    staleTime: 60_000, // 1 minute
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (data) {
      setNotifications(data);
    }
  }, [data, setNotifications]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onMutate: (id) => {
      markAsRead(id);
    },
    onError: () => {
      // Refetch on error to restore correct state
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleMarkRead = useCallback(
    (id: string) => {
      markReadMutation.mutate(id);
    },
    [markReadMutation]
  );

  return {
    notifications: data ?? notifications,
    unreadCount,
    isLoading: isLoading || storeLoading,
    isError,
    refetch,
    markAsRead: handleMarkRead,
  };
}

export function useUnreadCount() {
  const { unreadCount } = useNotificationStore();
  return unreadCount;
}
