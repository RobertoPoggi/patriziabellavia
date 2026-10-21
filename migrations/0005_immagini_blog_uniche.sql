-- Immagini dei box del blog: eliminati i duplicati (4 coppie di articoli con la stessa foto).
-- Gli articoli piu' recenti (e il 30 anni, che usava un ritratto maschile) ricevono una foto propria.
UPDATE blog_posts SET image_url='https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=600&q=75', image_position='center'
  WHERE slug='gestione-diversita-generazionale-hr';
UPDATE blog_posts SET image_url='https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=600&q=75', image_position='center'
  WHERE slug='offboarding-strategico-alumni-network-hr';
UPDATE blog_posts SET image_url='https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=75', image_position='center'
  WHERE slug='upskilling-reskilling-competenze-ai';
UPDATE blog_posts SET image_url='https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=75', image_position='top center'
  WHERE slug='patrizia-bellavia-30-anni-hr-consulenziale-milano';
