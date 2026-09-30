-- Integration test: ledger read rules isolate organizations.
-- Runs inside a transaction and always rolls back (no data left behind).
\set ON_ERROR_STOP on
BEGIN;
SELECT set_config('test.user_a','11111111-aaaa-4aaa-8aaa-000000000001',true),
       set_config('test.user_b','22222222-bbbb-4bbb-8bbb-000000000002',true),
       set_config('test.user_x','33333333-cccc-4ccc-8ccc-000000000003',true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('test.user_a'), 'role','authenticated')::text, true);

INSERT INTO organizations(id,name,slug) VALUES
 ('a0000000-0000-4000-8000-00000000000a','Test Org A','test-org-a-rls'),
 ('b0000000-0000-4000-8000-00000000000b','Test Org B','test-org-b-rls');
INSERT INTO organization_members(organization_id,user_id,role) VALUES
 ('a0000000-0000-4000-8000-00000000000a', current_setting('test.user_a')::uuid,'admin'),
 ('b0000000-0000-4000-8000-00000000000b', current_setting('test.user_b')::uuid,'admin');

INSERT INTO projects(id,user_id,organization_id,convention,org,org_type,title,pays,devise,taux,risque,debut,fin,periodicite,color,budget_lines,reports,fiches,amendements,infos)
SELECT pid::uuid, uid::uuid, oid::uuid, 'CONV-'||tag,'Org '||tag,'ONG','P '||tag,'SN','XOF',655.957,'Faible','2026-01-01','2026-12-31','Trimestriel',
 '{}'::jsonb,
 jsonb_build_array(jsonb_build_object('code','A1','section','A','desc','L','unite','u','qty',1,'montant',100,'allocation',100)),
 jsonb_build_array(jsonb_build_object('status','vide','depenses','{}'::jsonb,'previsions','{}'::jsonb,'explanation','{}'::jsonb,
   'transactions', jsonb_build_array(jsonb_build_object('id','tx-'||tag,'code','A1','montantEUR',50)))),
 '{"versements":[]}'::jsonb,'[]'::jsonb,'{}'::jsonb
FROM (VALUES ('c0000000-0000-4000-8000-0000000000a1', current_setting('test.user_a'),'a0000000-0000-4000-8000-00000000000a','A'),
             ('c0000000-0000-4000-8000-0000000000b1', current_setting('test.user_b'),'b0000000-0000-4000-8000-00000000000b','B')) v(pid,uid,oid,tag);

CREATE TEMP TABLE results(name text, ok boolean) ON COMMIT DROP;
GRANT ALL ON results TO authenticated;

CREATE OR REPLACE FUNCTION pg_temp.check_as(_uid text, _label text, _own text, _other text) RETURNS void LANGUAGE plpgsql AS $f$
DECLARE own_tx int; other_tx int; own_bl int; other_bl int;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub',_uid,'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO own_tx FROM project_transactions WHERE project_id = _own::uuid;
  SELECT count(*) INTO other_tx FROM project_transactions WHERE project_id = _other::uuid;
  SELECT count(*) INTO own_bl FROM budget_lines WHERE project_id = _own::uuid;
  SELECT count(*) INTO other_bl FROM budget_lines WHERE project_id = _other::uuid;
  INSERT INTO results VALUES (_label||': sees own transactions', own_tx = 1),
    (_label||': cannot see other org transactions', other_tx = 0),
    (_label||': sees own budget lines', own_bl = 1),
    (_label||': cannot see other org budget lines', other_bl = 0);
  RESET ROLE;
END $f$;

SELECT pg_temp.check_as(current_setting('test.user_a'),'User A','c0000000-0000-4000-8000-0000000000a1','c0000000-0000-4000-8000-0000000000b1');
SELECT pg_temp.check_as(current_setting('test.user_b'),'User B','c0000000-0000-4000-8000-0000000000b1','c0000000-0000-4000-8000-0000000000a1');

-- Outsider: sees nothing at all
SELECT set_config('request.jwt.claims', json_build_object('sub',current_setting('test.user_x'),'role','authenticated')::text, true);
SET LOCAL ROLE authenticated;
INSERT INTO results SELECT 'Outsider: sees no test transactions', count(*) = 0 FROM project_transactions
  WHERE project_id IN ('c0000000-0000-4000-8000-0000000000a1','c0000000-0000-4000-8000-0000000000b1');
-- Direct writes are refused (append-only, server-managed ledger)
DO $d$ BEGIN
  BEGIN
    INSERT INTO project_transactions(project_id,organization_id,report_index,external_id)
      VALUES ('c0000000-0000-4000-8000-0000000000b1','b0000000-0000-4000-8000-00000000000b',0,'forged');
    INSERT INTO results VALUES ('Client cannot write ledger directly', false);
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO results VALUES ('Client cannot write ledger directly', true);
  END;
END $d$;
RESET ROLE;

SELECT CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END AS result, name FROM results;
DO $z$ BEGIN IF EXISTS (SELECT 1 FROM results WHERE NOT ok) THEN RAISE EXCEPTION 'Ledger RLS test failed'; END IF; END $z$;
ROLLBACK;
