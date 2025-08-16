import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Notification, ApiResponse } from '../../../../shared/types';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private readonly NOTIFICATIONS_STORAGE_KEY = 'flour_delivery_notifications';
  private readonly REFRESH_INTERVAL = 30000; // 30 seconds

  constructor(private http: HttpClient) {
    this.loadNotificationsFromStorage();
    this.startAutoRefresh();
  }

  // Get all notifications
  getNotifications(): Observable<Notification[]> {
    return this.notifications$;
  }

  // Get unread notifications
  getUnreadNotifications(): Observable<Notification[]> {
    return this.notifications$.pipe(
      map(notifications => notifications.filter(n => !n.isRead))
    );
  }

  // Get unread count
  getUnreadCount(): Observable<number> {
    return this.unreadCount$;
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    );

    this.updateNotifications(updatedNotifications);
    this.updateUnreadCount(updatedNotifications);

    // Update on server
    this.http.put<ApiResponse<null>>(
      `${environment.apiUrl}/notifications/${notificationId}/read`,
      {}
    ).subscribe();
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(notification => ({
      ...notification,
      isRead: true
    }));

    this.updateNotifications(updatedNotifications);
    this.updateUnreadCount(updatedNotifications);

    // Update on server
    this.http.put<ApiResponse<null>>(
      `${environment.apiUrl}/notifications/read-all`,
      {}
    ).subscribe();
  }

  // Delete notification
  deleteNotification(notificationId: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.filter(
      notification => notification.id !== notificationId
    );

    this.updateNotifications(updatedNotifications);
    this.updateUnreadCount(updatedNotifications);

    // Delete from server
    this.http.delete<ApiResponse<null>>(
      `${environment.apiUrl}/notifications/${notificationId}`
    ).subscribe();
  }

  // Add notification locally (for real-time updates)
  addNotification(notification: Notification): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [notification, ...currentNotifications];
    
    this.updateNotifications(updatedNotifications);
    this.updateUnreadCount(updatedNotifications);
  }

  // Refresh notifications from server
  refreshNotifications(): Observable<Notification[]> {
    return this.http.get<ApiResponse<Notification[]>>(
      `${environment.apiUrl}/notifications`
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          const notifications = response.data;
          this.updateNotifications(notifications);
          this.updateUnreadCount(notifications);
          return notifications;
        }
        return [];
      }),
      catchError(error => {
        console.error('Failed to refresh notifications:', error);
        return [];
      })
    );
  }

  // Get notifications by type
  getNotificationsByType(type: string): Observable<Notification[]> {
    return this.notifications$.pipe(
      map(notifications => notifications.filter(n => n.type === type))
    );
  }

  // Get recent notifications (last 24 hours)
  getRecentNotifications(): Observable<Notification[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return this.notifications$.pipe(
      map(notifications => 
        notifications.filter(n => new Date(n.createdAt) > oneDayAgo)
      )
    );
  }

  // Check for new notifications
  checkForNewNotifications(): Observable<boolean> {
    return this.http.get<ApiResponse<{ hasNew: boolean }>>(
      `${environment.apiUrl}/notifications/check-new`
    ).pipe(
      map(response => response.success && response.data ? response.data.hasNew : false),
      catchError(() => [false])
    );
  }

  // Subscribe to real-time notifications
  subscribeToNotifications(): void {
    // This would typically connect to WebSocket or Server-Sent Events
    // For now, we'll use polling
    this.startAutoRefresh();
  }

  // Unsubscribe from real-time notifications
  unsubscribeFromNotifications(): void {
    this.stopAutoRefresh();
  }

  // Start auto-refresh
  private startAutoRefresh(): void {
    interval(this.REFRESH_INTERVAL).pipe(
      switchMap(() => this.checkForNewNotifications())
    ).subscribe(hasNew => {
      if (hasNew) {
        this.refreshNotifications().subscribe();
      }
    });
  }

  // Stop auto-refresh
  private stopAutoRefresh(): void {
    // Implementation would clear the interval
  }

  // Update notifications
  private updateNotifications(notifications: Notification[]): void {
    this.notificationsSubject.next(notifications);
    this.saveNotificationsToStorage(notifications);
  }

  // Update unread count
  private updateUnreadCount(notifications: Notification[]): void {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unreadCount);
  }

  // Save notifications to localStorage
  private saveNotificationsToStorage(notifications: Notification[]): void {
    try {
      localStorage.setItem(this.NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notifications to storage:', error);
    }
  }

  // Load notifications from localStorage
  private loadNotificationsFromStorage(): void {
    try {
      const storedNotifications = localStorage.getItem(this.NOTIFICATIONS_STORAGE_KEY);
      if (storedNotifications) {
        const notifications = JSON.parse(storedNotifications);
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount(notifications);
      }
    } catch (error) {
      console.error('Failed to load notifications from storage:', error);
      this.notificationsSubject.next([]);
      this.unreadCountSubject.next(0);
    }
  }

  // Clear all notifications
  clearAllNotifications(): void {
    this.updateNotifications([]);
    this.updateUnreadCount([]);
    
    // Clear from server
    this.http.delete<ApiResponse<null>>(
      `${environment.apiUrl}/notifications/clear-all`
    ).subscribe();
  }

  // Get notification statistics
  getNotificationStats(): Observable<{
    total: number;
    unread: number;
    read: number;
    byType: { [key: string]: number };
  }> {
    return this.notifications$.pipe(
      map(notifications => {
        const total = notifications.length;
        const unread = notifications.filter(n => !n.isRead).length;
        const read = total - unread;
        
        const byType: { [key: string]: number } = {};
        notifications.forEach(notification => {
          byType[notification.type] = (byType[notification.type] || 0) + 1;
        });

        return { total, unread, read, byType };
      })
    );
  }
}