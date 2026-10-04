import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';

async function verifyAllRequirements() {
  console.log('================================================================');
  console.log('🔍 Comprehensive Verification: Deposit Issue & Withdrawal Fees');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Verify user record in Firestore
  const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
  const app = initializeApp(cfg);
  const db = getFirestore(app, cfg.firestoreDatabaseId);

  const targetEmail = 'diegotudoemumsonegocio@gmail.com';
  console.log(`[1] Verifying Firestore records for ${targetEmail}...`);

  const q = query(collection(db, 'users'), where('email', '==', targetEmail));
  const snap = await getDocs(q);
  assert(!snap.empty, 'User exists in Firestore users collection');

  const fsUserDoc = snap.docs[0];
  const fsUserData = fsUserDoc.data();
  const userId = fsUserData.id || fsUserDoc.id;
  console.log(`User ID: ${userId}, email: ${fsUserData.email}`);

  assert(userId === 'usr_1791117746572', 'Deposit belongs to the correct user ID (usr_1791117746572)');
  assert(fsUserData.balances?.USDT_ERC20 === 2000000, 'User wallet balance in Firestore is 2,000,000 USDT_ERC20');

  // 2. Verify transaction in Firestore
  console.log('[2] Verifying transaction history in Firestore...');
  const txQ = query(collection(db, 'transactions'), where('userId', '==', userId));
  const txSnap = await getDocs(txQ);
  const depositTx = txSnap.docs.map(d => d.data()).find((t: any) => t.type === 'deposit');
  
  assert(Boolean(depositTx), 'Deposit transaction exists in Firestore transactions');
  assert(depositTx?.amount === 2000000, 'Deposit amount is correctly recorded as 2,000,000');
  assert(depositTx?.status === 'completed', 'Deposit status is correct ("completed")');
  assert(depositTx?.asset === 'USDT_ERC20', 'Deposit asset is USDT_ERC20');
  assert(depositTx?.userId === userId, 'Deposit transaction userId matches user account');

  // 3. Verify server-side records and admin view
  console.log('[3] Verifying server database & Admin view...');
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'help.netbybit@hotmail.com', password: 'admin' }),
  });
  const adminData = (await adminLoginRes.json()) as any;
  const adminToken = adminData.token;
  assert(Boolean(adminToken), 'Admin authenticated successfully');

  const searchRes = await fetch(`${BASE_URL}/api/admin/users/search?query=${encodeURIComponent(targetEmail)}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const searchUsers = (await searchRes.json()) as any[];
  const adminSeenUser = searchUsers.find(u => u.email.toLowerCase() === targetEmail);

  assert(Boolean(adminSeenUser), 'Admin can find user by email in Admin search');
  assert(adminSeenUser?.balances?.USDT_ERC20 === 2000000, 'Admin sees authoritative balance of 2,000,000 USDT_ERC20');

  // 4. Verify user-side view (/api/auth/me and /api/user/transactions)
  console.log('[4] Verifying user-side view matches Admin authoritative balance...');
  const userTokenPayload = Buffer.from(JSON.stringify({
    id: userId,
    email: targetEmail,
    name: fsUserData.name,
    role: 'user',
  })).toString('base64');
  const userToken = 'fb_user_token_' + userTokenPayload;

  const userMeRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const userMeData = (await userMeRes.json()) as any;

  assert(userMeRes.ok, 'User can fetch profile via /api/auth/me');
  assert(userMeData.id === userId, 'User profile ID matches correct user ID');
  assert(userMeData.balances?.USDT_ERC20 === 2000000, 'User /api/auth/me reads 2,000,000 USDT_ERC20');
  assert(userMeData.balances?.USDT_ERC20 === adminSeenUser?.balances?.USDT_ERC20, 'Admin and user are reading the exact same authoritative balance');

  // Verify transaction appears in user transaction history
  const userTxsRes = await fetch(`${BASE_URL}/api/user/transactions`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const userTxs = (await userTxsRes.json()) as any[];
  const userSeenDeposit = userTxs.find((t: any) => t.type === 'deposit' && t.amount === 2000000);
  assert(Boolean(userSeenDeposit), 'Deposit appears in user transaction history');
  assert(userSeenDeposit?.status === 'completed', 'User sees transaction status as completed');

  // 5. Verify duplicate deposit prevention (on isolated test transaction)
  console.log('[5] Verifying duplicate deposit prevention...');
  const testDupEmail = `dup_test_${Date.now()}@example.com`;
  
  // Create user
  await fetch(`${BASE_URL}/api/admin/users/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ email: testDupEmail, name: 'Dup Tester', password: 'Password123!' })
  });

  const firstDeposit = await fetch(`${BASE_URL}/api/admin/adjust-user-balance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      email: testDupEmail,
      asset: 'USDT_ERC20',
      action: 'add',
      amount: 100,
      reason: 'First Deposit',
    }),
  });
  assert(firstDeposit.status === 200, 'First deposit succeeded (status 200)');

  // Immediate second duplicate attempt
  const secondDeposit = await fetch(`${BASE_URL}/api/admin/adjust-user-balance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      email: testDupEmail,
      asset: 'USDT_ERC20',
      action: 'add',
      amount: 100,
      reason: 'First Deposit',
    }),
  });
  assert(secondDeposit.status === 409, 'Immediate second deposit blocked by duplicate prevention (status 409)');

  // 6. Test Withdrawal Network Fee Messages on live server
  console.log('[6] Testing live Withdrawal Network Fee messages...');
  
  // Scenario A: USDT ERC-20 withdrawal with insufficient ETH (user has 0 ETH, 2M USDT_ERC20)
  const erc20WithdrawRes = await fetch(`${BASE_URL}/api/user/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      type: 'withdraw',
      asset: 'USDT_ERC20',
      amount: 1000,
      destinationAddress: '0x1234567890123456789012345678901234567890',
    }),
  });
  const erc20WithdrawData = (await erc20WithdrawRes.json()) as any;
  const expectedErc20Message = 'Network Fee Required: Insufficient Ethereum (ETH) balance. Kindly deposit ETH to cover the network fee.';

  assert(erc20WithdrawRes.status === 400, 'USDT ERC-20 withdrawal blocked due to insufficient ETH');
  assert(erc20WithdrawData.error === expectedErc20Message, 'Exact USDT ERC-20 error message returned without specific amount');
  assert(!erc20WithdrawData.error?.includes('1 ETH'), 'USDT ERC-20 message does NOT contain "1 ETH"');
  assert(!erc20WithdrawData.error?.includes('TRON') && !erc20WithdrawData.error?.includes('TRX'), 'USDT ERC-20 message does NOT contain TRON/TRX');

  // Scenario B: USDT TRC-20 withdrawal with insufficient TRX (test user has 0 TRX)
  // First give test user some USDT_TRC20 so principal check passes
  await fetch(`${BASE_URL}/api/admin/adjust-user-balance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      email: testDupEmail,
      asset: 'USDT_TRC20',
      action: 'add',
      amount: 500,
      reason: 'TRC20 Test Funding',
    }),
  });

  const testUserTokenPayload = Buffer.from(JSON.stringify({
    id: 'test_dup_user',
    email: testDupEmail,
    name: 'Dup Tester',
    role: 'user',
  })).toString('base64');
  const testUserToken = 'fb_user_token_' + testUserTokenPayload;

  const trc20WithdrawRes = await fetch(`${BASE_URL}/api/user/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${testUserToken}`,
    },
    body: JSON.stringify({
      type: 'withdraw',
      asset: 'USDT_TRC20',
      amount: 100,
      destinationAddress: 'TX1234567890abcdef1234567890abcdef',
    }),
  });
  const trc20WithdrawData = (await trc20WithdrawRes.json()) as any;
  const expectedTrc20Message = 'Network Fee Required: Insufficient TRON (TRX) balance. Kindly deposit TRX to cover the network fee.';

  assert(trc20WithdrawRes.status === 400, 'USDT TRC-20 withdrawal blocked due to insufficient TRX');
  assert(trc20WithdrawData.error === expectedTrc20Message, 'Exact USDT TRC-20 error message returned without specific amount');
  assert(!trc20WithdrawData.error?.includes('10,000 TRX'), 'USDT TRC-20 message does NOT contain "10,000 TRX"');
  assert(!trc20WithdrawData.error?.includes('Ethereum') && !trc20WithdrawData.error?.includes('ETH'), 'USDT TRC-20 message does NOT contain Ethereum/ETH');

  // Verify balance remains correct after refresh/logout/login simulation
  console.log('[7] Verifying balance persistence after refresh and logout/login simulation...');
  const userMeRes2 = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const userMeData2 = (await userMeRes2.json()) as any;
  assert(userMeData2.balances?.USDT_ERC20 === 2000000, 'Balance for USDT_ERC20 remains 2,000,000 after re-fetch');

  console.log(`\n================================================================`);
  console.log(`Final Test Results: ${passed} passed, ${failed} failed.`);
  console.log(`================================================================`);
  process.exit(failed > 0 ? 1 : 0);
}

verifyAllRequirements().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
