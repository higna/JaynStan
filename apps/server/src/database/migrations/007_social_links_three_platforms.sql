DELETE FROM social_links WHERE platform = 'instagram';
ALTER TABLE social_links DROP CONSTRAINT IF EXISTS social_links_platform_check;
ALTER TABLE social_links ADD CONSTRAINT social_links_platform_check
  CHECK (platform IN ('facebook', 'whatsapp', 'twitter'));
