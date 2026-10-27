-- Restrict private seller portfolio access to its owner or explicitly opted-in public work.
-- Both predicates still require enabled closed-beta membership.
-- public_portfolio_image is an existing privileged *read-only* helper which
-- verifies the seller opted into public sharing and remains an enabled member.
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
