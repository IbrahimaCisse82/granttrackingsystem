-- Ledger isolation test. Always raises at the end so all test data rolls back.
-- Outcome: LEDGER_RLS_PASS or LEDGER_RLS_FAIL in the error message.
DO $t$
DECLARE a uuid:='11111111-aaaa-4aaa-8aaa-000000000001'; b uuid:='22222222-bbbb-4bbb-8bbb-000000000002'; x uuid:='33333333-cccc-4ccc-8ccc-000000000003';
 pa uuid:='c0000000-0000-4000-8000-0000000000a1'; pb uuid:='c0000000-0000-4000-8000-0000000000b1';
 oa uuid:='a0000000-0000-4000-8000-00000000000a'; ob uuid:='b0000000-0000-4000-8000-00000000000b';
 res text:=''; ok boolean:=true; n1 int; n2 int; n3 int; n4 int; wrote boolean;
 exp_a int[]; exp_b int[];
BEGIN
 PERFORM set_config('request.jwt.claims', json_build_object('sub',a,'role','authenticated')::text, true);
 INSERT INTO organizations(id,name,slug) VALUES (oa,'Test Org A','test-org-a-rls'),(ob,'Test Org B','test-org-b-rls');
 INSERT INTO organization_members(organization_id,user_id,role) VALUES (oa,a,'admin'),(ob,b,'admin');
 INSERT INTO projects(id,user_id,organization_id,convention,org,org_type,title,pays,devise,taux,risque,debut,fin,periodicite,color,budget_lines,reports,fiches,amendements,infos)
 SELECT v.pid,v.uid,v.oid,'CONV-'||v.tag,'Org '||v.tag,'ONG','P '||v.tag,'SN','XOF',655.957,'Faible','2026-01-01','2026-12-31','Trimestriel','{}'::jsonb,
  jsonb_build_array(jsonb_build_object('code','A1','section','A','desc','L','unite','u','qty',1,'montant',100,'allocation',100)),
  jsonb_build_array(jsonb_build_object('status','vide','depenses','{}'::jsonb,'previsions','{}'::jsonb,'explanation','{}'::jsonb,
   'transactions',jsonb_build_array(jsonb_build_object('id','tx-'||v.tag,'code','A1','montantEUR',50)))),
  '{"versements":[]}'::jsonb,'[]'::jsonb,'{}'::jsonb
 FROM (VALUES (pa,a,oa,'A'),(pb,b,ob,'B')) v(pid,uid,oid,tag);

 FOR i IN 1..3 LOOP
  PERFORM set_config('request.jwt.claims', json_build_object('sub',(ARRAY[a,b,x])[i],'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n1 FROM project_transactions WHERE project_id=pa;
  SELECT count(*) INTO n2 FROM project_transactions WHERE project_id=pb;
  SELECT count(*) INTO n3 FROM budget_lines WHERE project_id=pa;
  SELECT count(*) INTO n4 FROM budget_lines WHERE project_id=pb;
  BEGIN
   INSERT INTO project_transactions(project_id,organization_id,report_index,external_id) VALUES (pb,ob,0,'forged'); wrote:=true;
  EXCEPTION WHEN insufficient_privilege THEN wrote:=false; END;
  RESET ROLE;
  -- expected [txA, txB, blA, blB]
  exp_a := (ARRAY[ARRAY[1,0,1,0], ARRAY[0,1,0,1], ARRAY[0,0,0,0]])[i:i][1:4];
  IF ARRAY[[n1,n2,n3,n4]] <> exp_a OR wrote THEN ok:=false; END IF;
  res:=res||format('%s: txA=%s txB=%s blA=%s blB=%s write=%s | ',(ARRAY['A','B','X'])[i],n1,n2,n3,n4,wrote);
 END LOOP;
 RAISE EXCEPTION '% %', CASE WHEN ok THEN 'LEDGER_RLS_PASS' ELSE 'LEDGER_RLS_FAIL' END, res;
END $t$;
