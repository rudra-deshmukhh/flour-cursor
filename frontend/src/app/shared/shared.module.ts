import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Common Components
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { QuantitySelectorComponent } from './components/quantity-selector/quantity-selector.component';
import { AddressCardComponent } from './components/address-card/address-card.component';
import { OrderStatusBadgeComponent } from './components/order-status-badge/order-status-badge.component';
import { NotificationToastComponent } from './components/notification-toast/notification-toast.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { NotFoundComponent } from './components/not-found/not-found.component';

// Directives
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { DebounceClickDirective } from './directives/debounce-click.directive';
import { LazyLoadImageDirective } from './directives/lazy-load-image.directive';

// Pipes
import { CurrencyPipe } from './pipes/currency.pipe';
import { TimeAgoPipe } from './pipes/time-ago.pipe';
import { PhoneFormatPipe } from './pipes/phone-format.pipe';

@NgModule({
  declarations: [
    // Components
    LoadingSpinnerComponent,
    ProductCardComponent,
    QuantitySelectorComponent,
    AddressCardComponent,
    OrderStatusBadgeComponent,
    NotificationToastComponent,
    EmptyStateComponent,
    SearchBarComponent,
    PaginationComponent,
    NotFoundComponent,
    
    // Directives
    ClickOutsideDirective,
    DebounceClickDirective,
    LazyLoadImageDirective,
    
    // Pipes
    CurrencyPipe,
    TimeAgoPipe,
    PhoneFormatPipe
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    
    // Components
    LoadingSpinnerComponent,
    ProductCardComponent,
    QuantitySelectorComponent,
    AddressCardComponent,
    OrderStatusBadgeComponent,
    NotificationToastComponent,
    EmptyStateComponent,
    SearchBarComponent,
    PaginationComponent,
    NotFoundComponent,
    
    // Directives
    ClickOutsideDirective,
    DebounceClickDirective,
    LazyLoadImageDirective,
    
    // Pipes
    CurrencyPipe,
    TimeAgoPipe,
    PhoneFormatPipe
  ]
})
export class SharedModule { }