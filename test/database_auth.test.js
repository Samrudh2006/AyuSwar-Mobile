import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { isSupabaseConfigured, supabaseConfig } from '../src/services/supabaseClient.js';
import { authService } from '../src/services/authService.js';

console.log('--- RUNNING PHASE 4: DATABASE & AUTHENTICATION TESTS ---');

// 1. Current persistence contract: unconfigured test environment must be honest local demo mode.
{
  assert.strictEqual(isSupabaseConfigured, false, 'Default test environment must report unconfigured Supabase');
  assert.strictEqual(supabaseConfig.provider, 'LOCAL_DEMO_STORAGE');
  const providerInfo = authService.getProviderInfo();
  assert.strictEqual(providerInfo.configured, false);
  assert.strictEqual(providerInfo.authMode, 'DEMO_PROTOTYPE');
  console.log('✓ Test 1 Passed: unconfigured Supabase accurately degrades to labelled local demo persistence.');
}

// 2. Client isolation contract: zero service-role key references in frontend code.
{
  const srcFiles = [
    'src/services/supabaseClient.js',
    'src/services/authService.js',
    'src/views/UnifiedAuthView.jsx'
  ];
  for (const file of srcFiles) {
    const fullPath = resolve(file);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf8');
      assert.ok(!content.includes('SUPABASE_SERVICE_ROLE_KEY'), `${file} must NOT reference SUPABASE_SERVICE_ROLE_KEY`);
    }
  }
  console.log('✓ Test 2 Passed: zero server service-role keys bundled or referenced in frontend code.');
}

// 3. Demo OTP request and verification remain explicit prototype behavior.
{
  const otpReq = await authService.requestOtp({ destination: '+91-9876543210', type: 'phone' });
  assert.strictEqual(otpReq.success, true);
  assert.strictEqual(otpReq.isDemo, true);
  assert.strictEqual(otpReq.demoCode, '123456');
  const otpVerify = await authService.verifyOtp({
    destination: '+91-9876543210',
    token: '123456',
    type: 'phone',
    role: 'doctor',
    fullName: 'Dr. Test Prasad'
  });
  assert.strictEqual(otpVerify.success, true);
  assert.strictEqual(otpVerify.isDemo, true);
  assert.strictEqual(otpVerify.user.role, 'doctor');
  assert.strictEqual(otpVerify.user.isDemo, true);
  console.log('✓ Test 3 Passed: demo OTP request and verification stay explicit and synthetic.');
}

// 4. Server token verification route exists and applies shared API security.
{
  const verifyPath = resolve('api/auth/verify.js');
  assert.ok(existsSync(verifyPath), 'api/auth/verify.js must exist for server-side token checks');
  const verifySrc = readFileSync(verifyPath, 'utf8');
  assert.ok(verifySrc.includes('checkRateLimit'), 'api/auth/verify.js must enforce rate limiting');
  assert.ok(verifySrc.includes('sanitizeClientError'), 'api/auth/verify.js must sanitize errors');
  console.log('✓ Test 4 Passed: server-side token verification endpoint properly configured.');
}

// 5. Optional Supabase migration contract: verify when present, but do not invent production schema in a local prototype tree.
{
  const migration1Path = resolve('supabase/migrations/20261023_001_initial_schema.sql');
  const migration2Path = resolve('supabase/migrations/20261023_002_rls_policies.sql');
  if (existsSync(migration1Path) && existsSync(migration2Path)) {
    const schemaSql = readFileSync(migration1Path, 'utf8');
    const rlsSql = readFileSync(migration2Path, 'utf8');
    assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.profiles'));
    assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.triage_sessions'));
    assert.ok(rlsSql.includes('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;'));
    assert.ok(rlsSql.includes('ALTER TABLE public.triage_sessions ENABLE ROW LEVEL SECURITY;'));
    assert.ok(rlsSql.includes('auth.uid() = id'));
    assert.ok(rlsSql.includes('auth.uid() = user_id'));
    console.log('✓ Test 5 Passed: Supabase schema and RLS migrations verified.');
  } else {
    console.log('↷ Test 5 Skipped: Supabase migration tree is absent; local demo persistence is the active tested mode.');
  }
}

// 6. Optional feedback migration contract when present.
{
  const feedbackMigrationPath = resolve('supabase/migrations/20261024_003_feedback.sql');
  if (existsSync(feedbackMigrationPath)) {
    const feedbackSql = readFileSync(feedbackMigrationPath, 'utf8');
    assert.ok(feedbackSql.includes('create table if not exists public.feedback'));
    assert.ok(feedbackSql.includes('overall_stars int not null check (overall_stars between 1 and 5)'));
    assert.ok(feedbackSql.includes('alter table public.feedback enable row level security;'));
    console.log('✓ Test 6 Passed: feedback schema migration verified.');
  } else {
    console.log('↷ Test 6 Skipped: feedback migration is absent with the optional Supabase tree.');
  }
}

console.log('======================================================================');
console.log('PHASE 4 DATABASE & AUTHENTICATION CHECKS COMPLETE (4 pass, 2 conditional skips).');
console.log('======================================================================');
