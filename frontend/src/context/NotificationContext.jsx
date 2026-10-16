
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import api from '../utils/axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const MAX_RECONNECT_ATTEMPTS = 20;
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

export function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  // Keep notifications associated with their owner so that data
  // from one authenticated user is never displayed to another.
  const [notificationState, setNotificationState] = useState({
    userId: null,
    notifications: [],
  });

  const [isLoadingState, setIsLoadingState] = useState(false);

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const isUnmountedRef = useRef(false);
  const connectWebSocketRef = useRef(null);

  const isAuthenticatedRef = useRef(false);
  const currentUserIdRef = useRef(null);

  const userId = user?.id ?? null;
  const isUserAuthenticated = Boolean(isAuthenticated && userId);

  // Hide notification data immediately when the current user is
  // unauthenticated or the stored data belongs to another user.
  const notifications = useMemo(() => {
    if (
      !isUserAuthenticated ||
      notificationState.userId !== userId
    ) {
      return [];
    }

    return notificationState.notifications;
  }, [
    isUserAuthenticated,
    notificationState,
    userId,
  ]);

  // Derive the unread count instead of maintaining a second,
  // independently updated state variable.
  const unreadCount = useMemo(
    () => notifications.filter(
      (notification) => !notification.is_read
    ).length,
    [notifications]
  );

  const isLoading = isUserAuthenticated && isLoadingState;

  // Synchronize authentication information for asynchronous
  // WebSocket and HTTP callbacks.
  useEffect(() => {
    isAuthenticatedRef.current = isUserAuthenticated;
    currentUserIdRef.current = userId;
  }, [isUserAuthenticated, userId]);

  /**
   * Sort notifications by creation date, newest first.
   */
  const sortNotifications = useCallback((items) => {
    return [...items].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      return dateB - dateA;
    });
  }, []);

  /**
   * Merge notifications by ID.
   * Incoming server data updates existing notification fields.
   */
  const mergeNotifications = useCallback(
    (existing, incoming) => {
      const notificationMap = new Map();

      existing.forEach((notification) => {
        notificationMap.set(notification.id, notification);
      });

      incoming.forEach((notification) => {
        const previous = notificationMap.get(notification.id);

        notificationMap.set(notification.id, {
          ...previous,
          ...notification,
        });
      });

      return sortNotifications(
        Array.from(notificationMap.values())
      );
    },
    [sortNotifications]
  );

  /**
   * Fetch notifications for the authenticated user.
   */
  const fetchNotifications = useCallback(async () => {
    if (
      !isAuthenticatedRef.current ||
      !currentUserIdRef.current
    ) {
      return;
    }

    const requestedUserId = currentUserIdRef.current;

    setIsLoadingState(true);

    try {
      const response = await api.get('/api/notifications/');

      // Ignore a response if authentication changed while the
      // request was in progress.
      if (
        !isAuthenticatedRef.current ||
        currentUserIdRef.current !== requestedUserId
      ) {
        return;
      }

      const data = response.data?.data;

      const notificationList = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      setNotificationState((previous) => {
        // Keep notifications received from the WebSocket while
        // the HTTP request was running.
        const existing =
          previous.userId === requestedUserId
            ? previous.notifications
            : [];

        return {
          userId: requestedUserId,
          notifications: mergeNotifications(
            existing,
            notificationList
          ),
        };
      });
    } catch (error) {
      console.error(
        'Failed to fetch notifications:',
        error
      );
    } finally {
      if (currentUserIdRef.current === requestedUserId) {
        setIsLoadingState(false);
      }
    }
  }, [mergeNotifications]);

  /**
   * Add a notification received through WebSocket.
   * Duplicate IDs are ignored.
   */
  const addNotification = useCallback(
    (notification) => {
      if (
        !notification ||
        notification.id === undefined ||
        notification.id === null
      ) {
        return;
      }

      const ownerId = currentUserIdRef.current;

      if (
        !isAuthenticatedRef.current ||
        !ownerId
      ) {
        return;
      }

      setNotificationState((previous) => {
        const existing =
          previous.userId === ownerId
            ? previous.notifications
            : [];

        const alreadyExists = existing.some(
          (item) => item.id === notification.id
        );

        if (alreadyExists) {
          return previous;
        }

        return {
          userId: ownerId,
          notifications: sortNotifications([
            notification,
            ...existing,
          ]),
        };
      });
    },
    [sortNotifications]
  );

  /**
   * Connect to the Django Channels WebSocket endpoint.
   */
  const connectWebSocket = useCallback(() => {
    if (
      isUnmountedRef.current ||
      !isAuthenticatedRef.current
    ) {
      return;
    }

    // Prevent duplicate OPEN or CONNECTING sockets.
    if (
      socketRef.current &&
      (
        socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING
      )
    ) {
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const apiUrl = import.meta.env.VITE_API_URL;

    if (!apiUrl) {
      console.error(
        'VITE_API_URL is missing. Cannot connect to notification WebSocket.'
      );
      return;
    }

    let socketUrl;

    try {
      const normalizedApiUrl = apiUrl.replace(/\/+$/, '');

      socketUrl = normalizedApiUrl
        .replace(/^https:/i, 'wss:')
        .replace(/^http:/i, 'ws:');

      socketUrl = `${socketUrl}/ws/notifications/`;
    } catch (error) {
      console.error(
        'Failed to build notification WebSocket URL:',
        error
      );
      return;
    }

    let socket;

    try {
      socket = new WebSocket(socketUrl);
    } catch (error) {
      console.error(
        'Failed to create notification WebSocket:',
        error
      );
      return;
    }

    socketRef.current = socket;

    socket.onopen = () => {
      if (socketRef.current !== socket) {
        socket.close();
        return;
      }

      console.log('Notification WebSocket connected.');

      reconnectAttemptsRef.current = 0;
    };

    socket.onmessage = (event) => {
      if (socketRef.current !== socket) {
        return;
      }

      try {
        const data = JSON.parse(event.data);

        if (
          data.type === 'notification' &&
          data.notification
        ) {
          addNotification(data.notification);
        }
      } catch (error) {
        console.error(
          'Failed to process notification:',
          error
        );
      }
    };

    socket.onerror = (error) => {
      console.error(
        'Notification WebSocket error:',
        error
      );
    };

    socket.onclose = (event) => {
      // Ignore close events from an old socket.
      if (socketRef.current !== socket) {
        return;
      }

      socketRef.current = null;

      console.warn(
        'Notification WebSocket closed:',
        event.code,
        event.reason
      );

      if (
        isUnmountedRef.current ||
        !isAuthenticatedRef.current
      ) {
        return;
      }

      const attempt = reconnectAttemptsRef.current;

      if (attempt >= MAX_RECONNECT_ATTEMPTS) {
        console.warn(
          'Maximum notification WebSocket reconnect attempts reached.'
        );
        return;
      }

      const delay = Math.min(
        BASE_RECONNECT_DELAY * (2 ** attempt),
        MAX_RECONNECT_DELAY
      );

      reconnectAttemptsRef.current = attempt + 1;

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connectWebSocketRef.current?.();
      }, delay);

      console.log(
        `Reconnecting notification WebSocket in ${delay / 1000} seconds.`
      );
    };
  }, [addNotification]);

  /**
   * Keep the latest connection function available to reconnect
   * callbacks without capturing an outdated function.
   */
  useEffect(() => {
    connectWebSocketRef.current = connectWebSocket;

    return () => {
      connectWebSocketRef.current = null;
    };
  }, [connectWebSocket]);

  /**
   * Disconnect the socket and cancel pending reconnects.
   */
  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      const socket = socketRef.current;

      // Clear the reference and handlers before closing.
      socketRef.current = null;

      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;

      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close();
      }
    }

    reconnectAttemptsRef.current = 0;
  }, []);

  /**
   * Mark one notification as read.
   */
  const markAsRead = useCallback(
    async (notificationId) => {
      const requestedUserId = currentUserIdRef.current;

      if (
        !isAuthenticatedRef.current ||
        !requestedUserId
      ) {
        return false;
      }

      try {
        const response = await api.patch(
          `/api/notifications/${notificationId}/read/`
        );

        if (
          !isAuthenticatedRef.current ||
          currentUserIdRef.current !== requestedUserId
        ) {
          return false;
        }

        const updatedNotification =
          response.data?.data || response.data;

        setNotificationState((previous) => {
          if (previous.userId !== requestedUserId) {
            return previous;
          }

          return {
            ...previous,
            notifications: previous.notifications.map(
              (item) =>
                item.id === notificationId
                  ? {
                      ...item,
                      ...(updatedNotification || {}),
                      is_read: true,
                    }
                  : item
            ),
          };
        });

        return true;
      } catch (error) {
        console.error(
          'Failed to mark notification as read:',
          error
        );

        return false;
      }
    },
    []
  );

  /**
   * Mark every notification as read.
   */
  const markAllAsRead = useCallback(async () => {
    const requestedUserId = currentUserIdRef.current;

    if (
      !isAuthenticatedRef.current ||
      !requestedUserId
    ) {
      return false;
    }

    try {
      await api.patch('/api/notifications/read-all/');

      if (
        !isAuthenticatedRef.current ||
        currentUserIdRef.current !== requestedUserId
      ) {
        return false;
      }

      setNotificationState((previous) => {
        if (previous.userId !== requestedUserId) {
          return previous;
        }

        return {
          ...previous,
          notifications: previous.notifications.map(
            (notification) => ({
              ...notification,
              is_read: true,
            })
          ),
        };
      });

      return true;
    } catch (error) {
      console.error(
        'Failed to mark all notifications as read:',
        error
      );

      return false;
    }
  }, []);

  /**
   * Delete one notification.
   */
  const deleteNotification = useCallback(
    async (notificationId) => {
      const requestedUserId = currentUserIdRef.current;

      if (
        !isAuthenticatedRef.current ||
        !requestedUserId
      ) {
        return false;
      }

      try {
        await api.delete(
          `/api/notifications/${notificationId}/`
        );

        if (
          !isAuthenticatedRef.current ||
          currentUserIdRef.current !== requestedUserId
        ) {
          return false;
        }

        setNotificationState((previous) => {
          if (previous.userId !== requestedUserId) {
            return previous;
          }

          return {
            ...previous,
            notifications: previous.notifications.filter(
              (item) => item.id !== notificationId
            ),
          };
        });

        return true;
      } catch (error) {
        console.error(
          'Failed to delete notification:',
          error
        );

        return false;
      }
    },
    []
  );

  /**
   * Start notification loading and the socket connection when
   * authentication is available.
   *
   * Defer the API request to a microtask so its synchronous
   * loading-state update does not happen inside this effect.
   */
  useEffect(() => {
    isUnmountedRef.current = false;

    if (!isUserAuthenticated) {
      isAuthenticatedRef.current = false;
      currentUserIdRef.current = null;

      disconnectWebSocket();

      return () => {
        isUnmountedRef.current = true;
      };
    }

    isAuthenticatedRef.current = true;
    currentUserIdRef.current = userId;

    connectWebSocket();

    Promise.resolve().then(() => {
      if (
        !isUnmountedRef.current &&
        isAuthenticatedRef.current &&
        currentUserIdRef.current === userId
      ) {
        void fetchNotifications();
      }
    });

    return () => {
      isUnmountedRef.current = true;

      disconnectWebSocket();
    };
  }, [
    isUserAuthenticated,
    userId,
    fetchNotifications,
    connectWebSocket,
    disconnectWebSocket,
  ]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Access the notification context from child components.
 */
export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      'useNotifications must be used inside NotificationProvider'
    );
  }

  return context;
}
