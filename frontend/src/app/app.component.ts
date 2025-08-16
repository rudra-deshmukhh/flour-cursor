import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Flour Delivery';
  isLoggedIn = false;
  currentUser: any = null;
  cartItemCount = 0;
  notifications: any[] = [];
  showNotifications = false;
  currentRoute = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private cartService: CartService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    // Track route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
    });

    // Subscribe to auth state
    this.authService.authState$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
    });

    // Subscribe to cart updates
    this.cartService.cartItems$.subscribe(items => {
      this.cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
    });

    // Subscribe to notifications
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });

    // Check for PWA install prompt
    this.checkPWAInstallPrompt();
  }

  private checkPWAInstallPrompt() {
    let deferredPrompt: any;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show install button or banner
      this.showInstallPrompt();
    });
  }

  private showInstallPrompt() {
    // Implementation for showing install prompt
    console.log('PWA install prompt available');
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  markNotificationAsRead(notificationId: string) {
    this.notificationService.markAsRead(notificationId);
  }

  getCurrentRouteClass(route: string): string {
    return this.currentRoute === route ? 'active' : '';
  }
}