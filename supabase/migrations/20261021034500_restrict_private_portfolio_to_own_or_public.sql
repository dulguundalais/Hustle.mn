-- Restrict private portfolio metadata and Storage objects to the owner or
-- explicitly shared public seller work. Non-approved users are denied.
-- Matches applied Supabase migration: restrict_private_portfolio_to_own_or_public.
alter policy portfolio_read on public.portfolio_items
using (
  (select public.beta_role()) is not null
  and (
    seller_id = (select auth.uid())
    or hustle_private.public_portfolio_image(object_path)
  )
);

alter policy portfolio_objects_read on storage.objects
using (
  bucket_id = 'portfolio'
  and (select public.beta_role()) is not null
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or hustle_private.public_portfolio_image(name)
  )
);
