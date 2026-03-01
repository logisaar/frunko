import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';

export default function CouponManagement({ coupons, onUpdate }: { coupons: any[], onUpdate: () => void }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    code: '', discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '', min_order_value: '', max_discount: '',
    usage_limit: '', valid_until: '', is_active: true
  });

  const handleSave = async () => {
    try {
      const data = {
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_order_value: form.min_order_value ? parseFloat(form.min_order_value) : 0,
        max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
        valid_until: form.valid_until || null,
        is_active: form.is_active
      };

      if (editing) {
        await api.updateCoupon(editing.id, {
          code: form.code.toUpperCase(),
          discountType: form.discount_type,
          discountValue: parseFloat(form.discount_value),
          minOrderValue: form.min_order_value ? parseFloat(form.min_order_value) : 0,
          maxDiscount: form.max_discount ? parseFloat(form.max_discount) : undefined,
          usageLimit: form.usage_limit ? parseInt(form.usage_limit) : undefined,
          validUntil: form.valid_until || undefined,
          isActive: form.is_active
        });
        toast.success('Coupon updated successfully');
      } else {
        await api.createCoupon({
          code: form.code.toUpperCase(),
          discountType: form.discount_type,
          discountValue: parseFloat(form.discount_value),
          minOrderValue: form.min_order_value ? parseFloat(form.min_order_value) : 0,
          maxDiscount: form.max_discount ? parseFloat(form.max_discount) : undefined,
          usageLimit: form.usage_limit ? parseInt(form.usage_limit) : undefined,
          validUntil: form.valid_until || undefined,
          isActive: form.is_active
        });
        toast.success('Coupon created');
      }
      setShowDialog(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to save coupon');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this coupon?')) {
      await api.deleteCoupon(id);
      toast.success('Coupon deleted');
      onUpdate();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" />Coupon Codes</CardTitle>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => { setEditing(null); setForm({ code: '', discount_type: 'percentage', discount_value: '', min_order_value: '', max_discount: '', usage_limit: '', valid_until: '', is_active: true }); }}>
                <Plus className="h-4 w-4 mr-2" />Add Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Coupon</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="md:col-span-2">
                  <Label>Coupon Code</Label>
                  <Input placeholder="e.g. SUMMER50" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  <Label>Discount Type</Label>
                  <Select value={form.discount_type} onValueChange={v => setForm({ ...form, discount_type: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Discount Value</Label>
                  <Input placeholder="e.g. 50 or 200" type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} />
                </div>
                <div>
                  <Label>Min Order Value (Optional)</Label>
                  <Input placeholder="e.g. 500" type="number" value={form.min_order_value} onChange={e => setForm({ ...form, min_order_value: e.target.value })} />
                </div>
                <div>
                  <Label>Max Discount (Optional)</Label>
                  <Input placeholder="e.g. 100" type="number" value={form.max_discount} onChange={e => setForm({ ...form, max_discount: e.target.value })} />
                </div>
                <div>
                  <Label>Usage Limit (Optional)</Label>
                  <Input placeholder="How many times it can be used" type="number" value={form.usage_limit} onChange={e => setForm({ ...form, usage_limit: e.target.value })} />
                </div>
                <div>
                  <Label>Valid Until (Optional)</Label>
                  <Input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} />
                </div>
              </div>
              <Button onClick={handleSave} className="w-full mt-2">Save Coupon</Button>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {coupons.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-bold">{c.code}</p>
                <p className="text-sm text-muted-foreground">{c.discountType === 'percentage' || c.discount_type === 'percentage' ? `${c.discountValue || c.discount_value}%` : `₹${c.discountValue || c.discount_value}`} off</p>
                <Badge variant={c.isActive !== false && c.is_active !== false ? 'default' : 'secondary'}>{c.isActive !== false && c.is_active !== false ? 'Active' : 'Inactive'}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setEditing(c);
                  setForm({
                    code: c.code,
                    discount_type: c.discountType || c.discount_type || 'percentage',
                    discount_value: (c.discountValue || c.discount_value || '').toString(),
                    min_order_value: c.minOrderValue || c.min_order_value ? (c.minOrderValue || c.min_order_value).toString() : '',
                    max_discount: c.maxDiscount || c.max_discount ? (c.maxDiscount || c.max_discount).toString() : '',
                    usage_limit: c.usageLimit || c.usage_limit ? (c.usageLimit || c.usage_limit).toString() : '',
                    valid_until: c.validUntil || c.valid_until ? new Date(c.validUntil || c.valid_until).toISOString().split('T')[0] : '',
                    is_active: c.isActive !== false && c.is_active !== false
                  });
                  setShowDialog(true);
                }}><Edit className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
