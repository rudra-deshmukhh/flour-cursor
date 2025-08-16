// User related types
export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  role: 'user' | 'admin' | 'flour_mill' | 'delivery_partner';
}

// Product related types
export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: 'wheat' | 'rice' | 'millet' | 'pulse' | 'other';
  variants: ProductVariant[];
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  weight: number; // in kgs
  price: number;
  isAvailable: boolean;
}

// Order related types
export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  deliveryAddress: Address;
  deliveryInstructions?: string;
  paymentMethod: 'cod' | 'online';
  orderStatus: OrderStatus;
  subscription?: Subscription;
  discountCode?: string;
  estimatedDeliveryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  timeline: OrderTimeline[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  variant: ProductVariant;
  quantity: number;
  price: number;
}

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: Date;
  description: string;
  updatedBy: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'grinding'
  | 'ready_for_delivery'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

// Address related types
export interface Address {
  id: string;
  userId: string;
  flatNumber: string;
  flatName: string;
  streetName: string;
  locality: string;
  city: string;
  state: string;
  pinCode: string;
  location: {
    latitude: number;
    longitude: number;
  };
  isDefault: boolean;
  createdAt: Date;
}

// Subscription related types
export interface Subscription {
  id: string;
  userId: string;
  orderId: string;
  frequency: 'weekly' | 'biweekly';
  startDate: Date;
  nextDeliveryDate: Date;
  isActive: boolean;
  isPaused: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Discount code types
export interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
}

// Flour Mill types
export interface FlourMill {
  id: string;
  name: string;
  ownerId: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Delivery Partner types
export interface DeliveryPartner {
  id: string;
  name: string;
  phoneNumber: string;
  vehicleNumber: string;
  vehicleType: 'bike' | 'scooter' | 'car';
  currentLocation: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  isAvailable: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order_update' | 'promotion' | 'delivery' | 'system';
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: Date;
}

// Analytics types
export interface SalesAnalytics {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
}

export interface ProductAnalytics {
  productId: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;
  averageRating: number;
}

export interface LocationAnalytics {
  area: string;
  orderCount: number;
  totalRevenue: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface AuthRequest extends Request {
  user?: User;
}

export interface LoginRequest {
  phoneNumber: string;
  otp: string;
}

export interface OtpRequest {
  phoneNumber: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Socket types
export interface SocketEvents {
  'order-update': (orderId: string, status: OrderStatus) => void;
  'location-update': (deliveryId: string, location: { latitude: number; longitude: number }) => void;
  'notification': (userId: string, notification: Notification) => void;
}