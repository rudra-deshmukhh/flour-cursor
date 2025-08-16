import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  
  // Auth routes (public)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  
  // Home route
  {
    path: 'home',
    loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule),
    canActivate: [AuthGuard]
  },
  
  // Products route
  {
    path: 'products',
    loadChildren: () => import('./features/products/products.module').then(m => m.ProductsModule),
    canActivate: [AuthGuard]
  },
  
  // Cart route
  {
    path: 'cart',
    loadChildren: () => import('./features/cart/cart.module').then(m => m.CartModule),
    canActivate: [AuthGuard]
  },
  
  // Checkout route
  {
    path: 'checkout',
    loadChildren: () => import('./features/checkout/checkout.module').then(m => m.CheckoutModule),
    canActivate: [AuthGuard]
  },
  
  // Orders route
  {
    path: 'orders',
    loadChildren: () => import('./features/orders/orders.module').then(m => m.OrdersModule),
    canActivate: [AuthGuard]
  },
  
  // Order details route
  {
    path: 'orders/:id',
    loadChildren: () => import('./features/orders/order-details/order-details.module').then(m => m.OrderDetailsModule),
    canActivate: [AuthGuard]
  },
  
  // Subscriptions route
  {
    path: 'subscriptions',
    loadChildren: () => import('./features/subscriptions/subscriptions.module').then(m => m.SubscriptionsModule),
    canActivate: [AuthGuard]
  },
  
  // Profile route
  {
    path: 'profile',
    loadChildren: () => import('./features/profile/profile.module').then(m => m.ProfileModule),
    canActivate: [AuthGuard]
  },
  
  // Admin routes (admin only)
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  
  // Flour Mill routes (flour mill users only)
  {
    path: 'flour-mill',
    loadChildren: () => import('./features/flour-mill/flour-mill.module').then(m => m.FlourMillModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['flour_mill'] }
  },
  
  // Delivery routes (delivery partners only)
  {
    path: 'delivery',
    loadChildren: () => import('./features/delivery/delivery.module').then(m => m.DeliveryModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['delivery_partner'] }
  },
  
  // 404 route
  {
    path: '**',
    loadChildren: () => import('./shared/components/not-found/not-found.module').then(m => m.NotFoundModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    useHash: true, // For PWA compatibility
    scrollPositionRestoration: 'enabled',
    anchorScrolling: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }