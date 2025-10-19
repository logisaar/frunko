-- Insert the new Frunko Bowls items
INSERT INTO public.items (name, description, price, category, is_veg, is_available, images) VALUES
('Chock Fudge Oatmeal', 'Delicious chocolate fudge oatmeal bowl packed with nutrients and flavor', 60, 'frunko_bowls', true, true, ARRAY['/items/chock-fudge-oatmeal.jpg']),
('Mix Fruit Bowl', 'Fresh seasonal fruits mixed together for a healthy and refreshing treat', 80, 'frunko_bowls', true, true, ARRAY['/items/mix-fruit-bowl.jpg']),
('Mixfruit Bowl with Curd', 'Fresh mixed fruits topped with creamy curd for a perfect balance', 60, 'frunko_bowls', true, true, ARRAY['/items/mixfruit-bowl-curd.jpg']),
('Protein Choco', 'Protein-rich chocolate bowl perfect for post-workout nutrition', 60, 'frunko_bowls', true, true, ARRAY['/items/protein-choco.jpg']),
('Veggie Salad', 'Fresh vegetables mixed with healthy greens and light dressing', 80, 'frunko_bowls', true, true, ARRAY['/items/veggie-salad.jpg']);