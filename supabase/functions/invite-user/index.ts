import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { checkRateLimit, getIdentifier, rateLimitResponse } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non autorisé");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) throw new Error("Non autorisé");

    // Rate limit: max 10 invitations per minute per user
    const rl = await checkRateLimit(getIdentifier(req, caller.id), "invite-user", 10, 60);
    if (!rl.allowed) return rateLimitResponse(rl, corsHeaders);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { email, first_name, last_name, role, password, organization_id, org_role } = await req.json();
    if (!email) throw new Error("Email requis");

    // Authorization: must be global admin OR org admin/owner
    let authorized = false;

    // Check global admin
    const { data: roleData } = await adminClient.from("user_roles").select("role").eq("user_id", caller.id).single();
    if (roleData?.role === "admin") authorized = true;

    // Check org admin/owner
    if (!authorized && organization_id) {
      const { data: orgMember } = await adminClient
        .from("organization_members")
        .select("role")
        .eq("user_id", caller.id)
        .eq("organization_id", organization_id)
        .single();
      if (orgMember?.role === "owner" || orgMember?.role === "admin") {
        authorized = true;
      }
    }

    if (!authorized) throw new Error("Accès non autorisé");

    // Check if user already exists by email
    const { data: { users: existingUsers } } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.find((u: any) => u.email === email);

    let targetUserId: string;

    if (existingUser) {
      targetUserId = existingUser.id;

      // Check if already a member of this org
      if (organization_id) {
        const { data: existing } = await adminClient
          .from("organization_members")
          .select("id")
          .eq("user_id", targetUserId)
          .eq("organization_id", organization_id)
          .single();
        if (existing) {
          throw new Error("Cet utilisateur est déjà membre de cette organisation");
        }
      }
    } else {
      // Create new user
      const tempPassword = password || Math.random().toString(36).slice(-12) + "A1!";
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { first_name: first_name || "", last_name: last_name || "" },
      });
      if (createErr) throw createErr;
      targetUserId = newUser.user!.id;

      // Set app role if specified
      if (role && role !== "beneficiaire") {
        await adminClient.from("user_roles").update({ role }).eq("user_id", targetUserId);
      }
    }

    // Add to organization
    if (organization_id) {
      const memberRole = org_role || "member";
      await adminClient.from("organization_members").insert({
        organization_id,
        user_id: targetUserId,
        role: memberRole,
      });
    }

    return new Response(JSON.stringify({ success: true, user_id: targetUserId, existing: !!existingUser }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
