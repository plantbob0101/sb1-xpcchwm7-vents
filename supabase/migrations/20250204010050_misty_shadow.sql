/*
  # Insert Screen Data

  1. Changes
    - Insert all screen products with their specifications
    - Add proper width arrays and pricing tiers
*/

INSERT INTO screens (product, width, net_price_0_5k, net_price_5k_20k, net_price_20k_plus) VALUES
  ('Luxous 1147 FR', ARRAY[13.1, 15.4, 17.06], 0.214, 0.200, 0.188),
  ('Luxous 1147 ECO FR (30% recycled)', ARRAY[13.1, 15.4, 17.06], 0.214, 0.200, 0.188),
  ('Luxous 1547 D FR', ARRAY[14.1, 17.38], 0.214, 0.200, 0.188),
  ('Luxous 1145 D R', ARRAY[0.0], 0.386, 0.360, 0.338),
  ('Harmony 2047 FR', ARRAY[13.1], 0.300, 0.280, 0.263),
  ('Harmony 2747 FR', ARRAY[13.1], 0.314, 0.293, 0.275),
  ('Harmony 3647 FR', ARRAY[13.1], 0.329, 0.307, 0.288),
  ('Harmony 4647 FR', ARRAY[13.1], 0.329, 0.307, 0.288),
  ('Harmony 5747 FR', ARRAY[13.1, 15.4], 0.343, 0.320, 0.300),
  ('Harmony 2315 O FR', ARRAY[0.0], 0.271, 0.253, 0.238),
  ('Harmony 3315 O FR', ARRAY[0.0], 0.286, 0.267, 0.250),
  ('Harmony 4215 O FR', ARRAY[13.1], 0.286, 0.267, 0.250),
  ('Harmony 5220 O FR', ARRAY[13.1], 0.300, 0.280, 0.263),
  ('Harmony 3015 O E', ARRAY[13.1], 0.229, 0.213, 0.200),
  ('Harmony 3915 O E', ARRAY[13.1], 0.229, 0.213, 0.200),
  ('Harmony 5120 O E', ARRAY[13.1], 0.243, 0.227, 0.213),
  ('Harmony 6420 O E', ARRAY[13.1], 0.243, 0.227, 0.213),
  ('Harmony 5845 R FR', ARRAY[0.0], 0.757, 0.707, 0.663),
  ('Obscura 9950 FR W', ARRAY[17.3], 0.314, 0.293, 0.275),
  ('Obscura 10075 FB A+BW', ARRAY[13.1, 17.3], 0.800, 0.747, 0.700),
  ('Obscura 10075 FB A+B', ARRAY[19.0, 13.1, 14.1], 0.686, 0.640, 0.600),
  ('Obscura 10070 FR WB+BW', ARRAY[13.1, 15.4, 13.1], 0.657, 0.613, 0.575),
  ('Obscura 10070 FR WB+B', ARRAY[13.1], 0.557, 0.520, 0.488),
  ('Obscura 10050 FB A', ARRAY[14.1, 14.1, 17.3], 0.386, 0.360, 0.338),
  ('Obscura 10050 FB B', ARRAY[10.9, 13.1, 14.1], 0.257, 0.240, 0.225),
  ('Obscura 10050 FR BW', ARRAY[14.1, 14.1, 15.4, 17.3], 0.343, 0.320, 0.300),
  ('Obscura 10050 BW', ARRAY[14.7], 0.186, 0.173, 0.163),
  ('Obscura 10070 R FR W', ARRAY[9.8, 13.1], 0.514, 0.480, 0.450),
  ('Obscura 10070 R BW', ARRAY[11.9], 0.300, 0.280, 0.263),
  ('Tempa 5155 C AW', ARRAY[12.4], 0.514, 0.480, 0.450),
  ('Tempa 5155 C A AW', ARRAY[12.4], 0.586, 0.547, 0.513),
  ('Solaro 6125 O FB', ARRAY[0.0], 0.314, 0.293, 0.275),
  ('Solaro 5120 O E A AW', ARRAY[0.0], 0.543, 0.507, 0.475),
  ('Solaro 6125 O E A AW', ARRAY[13.1], 0.557, 0.520, 0.488),
  ('XSECT XTREME (1515)', ARRAY[11.8, 13.7], 0.557, 0.520, 0.488),
  ('XSECT XTRA (1535)', ARRAY[11.8, 13.7], 0.471, 0.440, 0.413),
  ('XSECT BALANCE (4045)', ARRAY[11.8, 13.7], 0.229, 0.213, 0.200),
  ('Solarwoven Ultra', ARRAY[8.85, 13.1], 0.200, 0.187, 0.175),
  ('Horticultural Textile 42 FR', ARRAY[9.84], 0.857, 0.800, 0.750),
  ('Horticultural Textile 98 FR WBW', ARRAY[9.84], 0.929, 0.867, 0.813),
  ('Horticultural Textile 100 FR', ARRAY[5.9], 1.257, 1.173, 1.100);