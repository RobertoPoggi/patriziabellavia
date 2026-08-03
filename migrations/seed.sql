-- ============================================================
-- Seed: admin + dati iniziali blog e clienti
-- Password: admin2026! (hash bcrypt-like, sarà generato)
-- In produzione viene generato dall'API /api/admin/init
-- ============================================================

-- Admin iniziale (password verrà impostata via /api/admin/init)
INSERT OR IGNORE INTO admin_users (username, password_hash)
VALUES ('admin', 'CHANGE_ME_ON_FIRST_LOGIN');

-- Articoli blog esistenti (12 articoli)
INSERT OR IGNORE INTO blog_posts (slug, title, category, abstract, image_url, image_position, published_at) VALUES
('assessment-soft-skill-cosa-come-quando',
 'Assessment Soft Skill: cosa valutare, come farlo, quando farlo',
 'Assessment & Sviluppo',
 'Guida completa all''assessment delle soft skill in azienda: strumenti, metodi e timing ottimale per valutare le competenze comportamentali.',
 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=75',
 'top center', '2024-01-15 09:00:00'),

('coaching-executive-icf-quando-serve',
 'Coaching Executive ICF: quando serve davvero',
 'Coaching',
 'Differenze tra coaching e mentoring, quando il coaching executive ICF produce risultati concreti e come scegliere il coach giusto.',
 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=75',
 'top center', '2024-02-01 09:00:00'),

('feedback-360-come-implementarlo',
 'Feedback 360°: come implementarlo senza errori',
 'Assessment & Sviluppo',
 'Metodologia, strumenti e best practice per un sistema di analisi a 360° efficace. Gli errori più comuni e come evitarli.',
 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=600&q=75',
 'top center', '2024-02-15 09:00:00'),

('modelli-leadership-situazionale-transteorica',
 'Modelli di Leadership: situazionale, transteorica e oltre',
 'Leadership',
 'Confronto tra i principali modelli di leadership: situazionale, trasformazionale, transteorica. Come scegliere quello giusto per la tua organizzazione.',
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=75',
 'top center', '2024-03-01 09:00:00'),

('succession-planning-tavole-successione',
 'Succession Planning: le Tavole di Successione che funzionano',
 'Talent Management',
 'Come costruire tavole di successione efficaci per garantire la continuità manageriale e gestire il passaggio generazionale in azienda.',
 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=600&q=75',
 'center', '2024-03-15 09:00:00'),

('clima-organizzativo-indici-survey-azioni',
 'Clima Organizzativo: indici, survey e piani d''azione',
 'Clima & Engagement',
 'Metodologia completa per misurare il clima organizzativo: quali KPI monitorare, come strutturare la survey e trasformare i dati in azioni concrete.',
 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=75',
 'top center', '2024-04-01 09:00:00'),

('performance-management-mbo-guida-pratica',
 'Performance Management e MBO: guida pratica 2024',
 'Performance & MBO',
 'Sistema completo di performance management con obiettivi SMART e cascade MBO. Dalla definizione degli obiettivi alla valutazione finale.',
 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=75',
 'top center', '2024-04-15 09:00:00'),

('engagement-retention-cosa-misurare',
 'Engagement e Retention: cosa misurare per non perdere i talenti',
 'Clima & Engagement',
 'I 7 indicatori chiave di engagement da monitorare, come interpretarli e le azioni HR più efficaci per migliorare la retention dei talenti.',
 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=600&q=75',
 'center', '2024-05-01 09:00:00'),

('hr-senior-advisor-vs-hr-director',
 'HR Senior Advisor vs HR Director: quando scegliere la consulenza',
 'HR Strategy',
 'Differenze tra HR Director interno e HR Senior Advisor esterno. Quando la consulenza HR produce più valore e come strutturare il rapporto.',
 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=75',
 'top center', '2024-05-15 09:00:00'),

('onboarding-soft-skill-primi-90-giorni',
 'Onboarding e Soft Skill: i primi 90 giorni che contano',
 'Assessment & Sviluppo',
 'Come strutturare un piano di onboarding che sviluppi le soft skill nei primi 90 giorni. Strumenti, check-point e KPI per misurare l''efficacia.',
 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=600&q=75',
 'top center', '2024-06-01 09:00:00'),

('talent-review-come-condurla',
 'Talent Review: come condurla e renderla utile davvero',
 'Talent Management',
 'Metodologia pratica per la talent review annuale: griglia 9-box, calibration session, output concreti e integrazione con il succession planning.',
 'https://images.unsplash.com/photo-1552664688-cf412ec27db2?auto=format&fit=crop&w=600&q=75',
 'center', '2024-06-15 09:00:00'),

('patrizia-bellavia-30-anni-hr-consulenziale-milano',
 '30 anni di consulenza HR a Milano: lezioni e prospettive',
 'HR Strategy',
 'Riflessioni di Patrizia Bellavia su tre decenni di consulenza HR per multinazionali: cosa è cambiato, cosa rimane costante e le sfide del futuro.',
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=75',
 'top center', '2024-07-01 09:00:00');

-- Clienti di esempio (anonimizzati)
INSERT OR IGNORE INTO clients (company, sector, status, start_year, notes) VALUES
('Multinazionale Telco A', 'Telecomunicazioni', 'past', 2018, 'Assessment soft skill per 120 manager. Progetto completato con successo.'),
('Gruppo Automotive B', 'Automotive', 'past', 2019, 'Clima organizzativo e MBO per sede italiana. 4.8/5 soddisfazione.'),
('Banca C', 'Bancario / Finanziario', 'active', 2021, 'Succession planning e tavole di successione. In corso.'),
('Impiantistica D', 'Impiantistica', 'past', 2020, 'Coaching executive ICF per 8 dirigenti. Completato.');
