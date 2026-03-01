export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private getToken(): string | null {
        return localStorage.getItem('auth_token');
    }

    setToken(token: string) {
        localStorage.setItem('auth_token', token);
    }

    clearToken() {
        localStorage.removeItem('auth_token');
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
    ): Promise<T> {
        const token = this.getToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...((options.headers as Record<string, string>) || {}),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        // Handle empty responses (204, etc.)
        const text = await response.text();
        return text ? JSON.parse(text) : ({} as T);
    }

    // Auth
    async signUp(email: string, password: string, fullName: string) {
        return this.request<{ user: any; token: string }>('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, fullName }),
        });
    }

    async signIn(email: string, password: string) {
        return this.request<{ user: any; token: string }>('/auth/signin', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    getGoogleAuthUrl() {
        return `${this.baseUrl}/auth/google`;
    }

    async getSession() {
        return this.request<{ user: any }>('/auth/session');
    }

    async signOut() {
        return this.request<{ message: string }>('/auth/signout', {
            method: 'POST',
        });
    }

    // Users / Profile
    async getProfile() {
        return this.request<any>('/users/profile');
    }

    async updateProfile(data: { fullName?: string; phone?: string; address?: string }) {
        return this.request<any>('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async getAllUsers() {
        return this.request<any[]>('/users');
    }

    async updateUserRole(userId: string, role: string) {
        return this.request<any>(`/users/${userId}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role }),
        });
    }

    // Items
    async getItems(includeAll = false) {
        const query = includeAll ? '?all=true' : '';
        const items = await this.request<any[]>(`/items${query}`);
        return items.map((item: any) => ({
            ...item,
            is_veg: item.isVeg,
            is_available: item.isAvailable,
            created_at: item.createdAt,
        }));
    }

    async getItem(id: string) {
        const item = await this.request<any>(`/items/${id}`);
        return item ? {
            ...item,
            is_veg: item.isVeg,
            is_available: item.isAvailable,
            created_at: item.createdAt,
        } : null;
    }

    async createItem(data: any) {
        return this.request<any>('/items', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateItem(id: string, data: any) {
        return this.request<any>(`/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteItem(id: string) {
        return this.request<any>(`/items/${id}`, {
            method: 'DELETE',
        });
    }

    async toggleItemAvailability(id: string) {
        return this.request<any>(`/items/${id}/toggle-availability`, {
            method: 'PUT',
        });
    }

    // Orders
    private mapOrder(order: any) {
        return {
            ...order,
            total_amount: order.totalAmount ?? order.total_amount,
            delivery_address: order.deliveryAddress ?? order.delivery_address,
            coupon_code: order.couponCode ?? order.coupon_code,
            discount_amount: order.discountAmount ?? order.discount_amount,
            qr_code: order.qrCode ?? order.qr_code,
            created_at: order.createdAt ?? order.created_at,
            updated_at: order.updatedAt ?? order.updated_at,
            completed_at: order.completedAt ?? order.completed_at,
            expected_delivery_time: order.expectedDeliveryTime ?? order.expected_delivery_time,
            payment_status: order.paymentStatus ?? order.payment_status ?? 'pending',
            payment_method: order.paymentMethod ?? order.payment_method,
            paytm_order_id: order.paytmOrderId ?? order.paytm_order_id,
            paytm_txn_id: order.paytmTxnId ?? order.paytm_txn_id,
            paid_at: order.paidAt ?? order.paid_at,
            order_items: (order.orderItems || order.order_items || []).map((oi: any) => ({
                ...oi,
                item_id: oi.itemId ?? oi.item_id,
                order_id: oi.orderId ?? oi.order_id,
                created_at: oi.createdAt ?? oi.created_at,
            })),
            profiles: order.user ? {
                full_name: order.user.fullName,
                email: order.user.email,
            } : order.profiles,
        };
    }

    async getOrders() {
        const orders = await this.request<any[]>('/orders');
        return orders.map((o: any) => this.mapOrder(o));
    }

    async getAllOrders() {
        const orders = await this.request<any[]>('/orders/all');
        return orders.map((o: any) => this.mapOrder(o));
    }

    async getOrderStats() {
        return this.request<{ count: number; revenue: number; recent: any[] }>('/orders/stats');
    }

    async getOrder(id: string) {
        const order = await this.request<any>(`/orders/${id}`);
        return this.mapOrder(order);
    }

    async uploadItemImages(files: FileList | File[]) {
        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('images', file);
        });

        const token = this.getToken();
        const res = await fetch(`${this.baseUrl}/uploads/items`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                // Note: Do NOT set Content-Type for FormData, the browser must set it with the boundary automatically
            },
            body: formData
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || 'Image upload failed');
        }

        return res.json() as Promise<{ urls: string[] }>;
    }

    async createOrder(data: {
        totalAmount: number;
        deliveryAddress: string;
        couponCode?: string;
        discountAmount?: number;
        items: { itemId: string; quantity: number; price: number }[];
    }) {
        return this.request<any>('/orders', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateOrderStatus(id: string, status: string) {
        return this.request<any>(`/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }

    async deleteOrder(id: string) {
        return this.request<any>(`/orders/${id}`, {
            method: 'DELETE',
        });
    }

    // Plans
    async getPlans(includeAll = false) {
        const query = includeAll ? '?all=true' : '';
        const plans = await this.request<any[]>(`/plans${query}`);

        return plans.map(plan => ({
            ...plan,
            is_active: plan.isActive,
            created_at: plan.createdAt,
            updated_at: plan.updatedAt
        }));
    }

    async createPlan(data: any) {
        return this.request<any>('/plans', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updatePlan(id: string, data: any) {
        return this.request<any>(`/plans/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deletePlan(id: string) {
        return this.request<any>(`/plans/${id}`, {
            method: 'DELETE',
        });
    }

    async togglePlanActive(id: string) {
        return this.request<any>(`/plans/${id}/toggle-active`, {
            method: 'PUT',
        });
    }

    // Coupons
    async validateCoupon(code: string, subtotal: number) {
        return this.request<{
            valid: boolean;
            code: string;
            discount: number;
            discountPercent: number;
            finalAmount: number;
        }>('/coupons/validate', {
            method: 'POST',
            body: JSON.stringify({ code, subtotal }),
        });
    }

    async getCoupons() {
        return this.request<any[]>('/coupons');
    }

    async createCoupon(data: any) {
        return this.request<any>('/coupons', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateCoupon(id: string, data: any) {
        return this.request<any>(`/coupons/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteCoupon(id: string) {
        return this.request<any>(`/coupons/${id}`, {
            method: 'DELETE',
        });
    }

    // Reviews
    async getReviews() {
        return this.request<any[]>('/reviews');
    }

    async getItemReviews(itemId: string) {
        return this.request<any[]>(`/reviews/item/${itemId}`);
    }

    async createReview(data: { itemId: string; orderId?: string; rating: number; comment?: string }) {
        return this.request<any>('/reviews', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async deleteReview(id: string) {
        return this.request<any>(`/reviews/${id}`, {
            method: 'DELETE',
        });
    }

    // Subscriptions
    async getSubscriptions() {
        return this.request<any[]>('/subscriptions');
    }

    async deleteSubscription(id: string) {
        return this.request<any>(`/subscriptions/${id}`, {
            method: 'DELETE',
        });
    }

    // Reports / Dashboard
    async getDashboardStats() {
        return this.request<any>('/admin/dashboard-stats');
    }

    // Paytm Payment
    async initiatePaytmPayment(orderId: string, amount: number, email?: string, phone?: string) {
        return this.request<{
            orderId: string;
            txnToken: string;
            mid: string;
            amount: string;
        }>('/paytm/initiate', {
            method: 'POST',
            body: JSON.stringify({ orderId, amount, email, phone }),
        });
    }

    // Addresses
    async getAddresses() {
        return this.request<any[]>('/addresses');
    }

    async createAddress(data: { label: string; fullAddress: string; latitude?: number; longitude?: number; landmark?: string; isDefault?: boolean }) {
        return this.request<any>('/addresses', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateAddress(id: string, data: any) {
        return this.request<any>(`/addresses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteAddress(id: string) {
        return this.request<any>(`/addresses/${id}`, {
            method: 'DELETE',
        });
    }

    async setDefaultAddress(id: string) {
        return this.request<any>(`/addresses/${id}/default`, {
            method: 'PUT',
        });
    }

    async reverseGeocode(lat: number, lng: number) {
        return this.request<any>(`/addresses/reverse-geocode?lat=${lat}&lng=${lng}`);
    }
}

export const api = new ApiClient(API_BASE_URL);
