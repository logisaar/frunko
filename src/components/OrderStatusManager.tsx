import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type OrderStatus = "pending" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";

interface OrderStatusManagerProps {
  orderId: string;
  currentStatus: OrderStatus;
  onStatusUpdate: (newStatus: OrderStatus) => void;
}

export default function OrderStatusManager({ orderId, currentStatus, onStatusUpdate }: OrderStatusManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    try {
      const updateData: any = { status: newStatus };

      // Set completed_at when status is delivered
      if (newStatus === 'delivered') {
        updateData.completedAt = new Date().toISOString();
      }

      await api.updateOrderStatus(orderId, newStatus);

      onStatusUpdate(newStatus);
      toast.success(`Order status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error: any) {
      toast.error('Failed to update order status');
      console.error('Error updating order status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Badge className={getStatusColor(currentStatus)}>
        {currentStatus.replace('_', ' ')}
      </Badge>
      <Select
        value={currentStatus}
        onValueChange={handleStatusUpdate}
        disabled={isUpdating}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="preparing">Preparing</SelectItem>
          <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
          <SelectItem value="delivered">Delivered</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}