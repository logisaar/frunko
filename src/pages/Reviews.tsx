import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Review = Database['public']['Tables']['reviews']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type FoodItem = Database['public']['Tables']['items']['Row'];

interface EnrichedReview extends Review {
  profiles?: Profile;
  items?: FoodItem;
}

export default function Reviews() {
  const [reviews, setReviews] = useState<EnrichedReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      // Load reviews with user and item details
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Fetch profiles and items to join with reviews
      const userIds = [...new Set(reviewsData?.map(r => r.user_id) || [])];
      const itemIds = [...new Set(reviewsData?.map(r => r.item_id) || [])];

      const [profilesData, itemsData] = await Promise.all([
        supabase.from('profiles').select('*').in('user_id', userIds),
        supabase.from('items').select('*').in('id', itemIds)
      ]);

      // Join the data manually
      const enrichedReviews = (reviewsData || []).map(review => ({
        ...review,
        profiles: profilesData.data?.find(p => p.user_id === review.user_id),
        items: itemsData.data?.find(i => i.id === review.item_id)
      }));

      setReviews(enrichedReviews);
    } catch (error: any) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-bg mobile-nav-spacing">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Customer Reviews</h1>
            <p className="text-muted-foreground">See what our customers are saying about our food</p>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No reviews yet</h3>
              <p className="text-muted-foreground">Be the first to leave a review!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <Card key={review.id} className="shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {review.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-lg">{review.profiles?.full_name || 'Anonymous'}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-muted-foreground ml-2">
                          {review.rating}/5
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3">
                      <Badge variant="outline" className="text-xs">
                        {review.items?.name || 'Unknown Item'}
                      </Badge>
                    </div>
                    {review.comment && (
                      <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
