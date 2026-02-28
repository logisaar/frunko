export interface Item {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    images: string[];
    isVeg: boolean;
    isAvailable: boolean;
    created_at?: string;
    updated_at?: string;
    // Support for legacy snake_case components temporarily
    is_veg?: boolean;
    is_available?: boolean;
}

export interface Order {
    id: string;
    user_id: string;
    total_amount: number;
    status: string;
    delivery_address: string | null;
    created_at: string;
    order_items?: any[];
}

export interface User {
    id: string;
    full_name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    role: string;
    isActive?: boolean;
    is_active?: boolean;
    user_id?: string;
    created_at?: string;
    last_login?: string;
}

export interface Plan {
    id: string;
    name: string;
    price: number;
    description: string;
    frequency: string;
    isActive: boolean;
    is_active?: boolean;
}

export interface Review {
    id: string;
    user_id: string;
    item_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
}

export interface Coupon {
    id: string;
    code: string;
    discount_type: string;
    discount_value: number;
    min_order_value: number;
    is_active: boolean;
    max_discount?: number | null;
    usage_limit?: number | null;
    used_count?: number;
    valid_until?: string | null;
    created_at?: string;
}

export interface Subscription {
    id: string;
    user_id: string;
    plan_id: string;
    status: string;
    start_date: string;
    end_date?: string;
    plans?: Plan;
}
