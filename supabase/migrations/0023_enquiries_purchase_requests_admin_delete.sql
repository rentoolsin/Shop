-- Admin delete access was missing for enquiries and purchase_requests.
-- Both tables have RLS enabled with admin SELECT/UPDATE policies (see
-- 0001_init_schema.sql), but no DELETE policy — so a DELETE from the admin
-- app matched zero rows under RLS and returned success with no error,
-- making the UI show "Enquiry deleted." / "Purchase request deleted."
-- while the row silently remained in the table.
create policy "admin delete enquiries" on enquiries
  for delete using (is_admin());
create policy "admin delete purchase requests" on purchase_requests
  for delete using (is_admin());
