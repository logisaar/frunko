import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Coupon = Database['public']['Tables']['coupon_codes']['Row'];

export default function CouponManagement({ coupons, onUpdate }: { coupons: Coupon[], onUpdate: () => void }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
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
        await supabase.from('coupon_codes').update(data).eq('id', editing.id);
        toast.success('Coupon updated');
      } else {
        await supabase.from('coupon_codes').insert([data]);
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
      await supabase.from('coupon_codes').delete().eq('id', id);
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
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Coupon</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Code</Label><Input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} /></div>
                <div><Label>Type</Label><Select value={form.discount_type} onValueChange={v => setForm({...form, discount_type: v as any})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed">Fixed Amount</SelectItem></SelectContent></Select></div>
                <div><Label>Value</Label><Input type="number" value={form.discount_value} onChange={e => setForm({...form, discount_value: e.target.value})} /></div>
                <div><Label>Min Order</Label><Input type="number" value={form.min_order_value} onChange={e => setForm({...form, min_order_value: e.target.value})} /></div>
                <Button onClick={handleSave} className="w-full">Save</Button>
              </div>
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
                <p className="text-sm text-muted-foreground">{c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`} off</p>
                <Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
