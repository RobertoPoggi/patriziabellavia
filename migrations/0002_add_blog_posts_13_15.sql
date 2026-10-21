-- Aggiunge i 3 nuovi articoli del blog (totale 15). Idempotente (INSERT OR IGNORE su slug UNIQUE).
INSERT OR IGNORE INTO blog_posts (slug, title, category, abstract, image_url, image_position, published, published_at) VALUES
('gestione-diversita-generazionale-hr',
 'Gestione della Diversità Generazionale in Azienda: Strategie HR',
 'Cultura & Leadership HR',
 'Come integrare Baby Boomer, Gen X, Millennials e Gen Z: mappa delle fratture, cross-mentoring e leadership flessibile per trasformare il conflitto in vantaggio competitivo.',
 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=75',
 'center', 1, '2026-08-03 09:00:00'),

('offboarding-strategico-alumni-network-hr',
 'Offboarding Strategico e Alumni Network: Guida per Direzioni HR',
 'Talent Strategy & Branding',
 'Exit interview, handover e relazione con gli ex dipendenti: come trasformare le dimissioni in opportunità e costruire un alumni network che genera valore.',
 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=600&q=75',
 'center', 1, '2026-08-03 09:05:00'),

('upskilling-reskilling-competenze-ai',
 'Upskilling e Reskilling nell''Era dell''AI: Metodo e Strategie HR',
 'Strategia HR & Sviluppo',
 'Framework in 4 fasi per riqualificare le competenze aziendali nell''era dell''AI: task decay, skill proximity, percorsi 70-20-10 e KPI di internal mobility.',
 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=75',
 'center', 1, '2026-08-03 09:10:00');
