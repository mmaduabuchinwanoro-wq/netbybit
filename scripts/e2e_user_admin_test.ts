import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function runEndToEndTests() {
  console.log('====================================================');
  console.log('🚀 Starting Full End-to-End User & Admin Flow Tests');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${description}`);
      failed++;
    }
  }

  try {
    // 1. Register a fresh user account
    const testEmail = `testuser_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    console.log(`[1] Registering test user: ${testEmail}`);

    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Test Trader',
      }),
    });
    const registerData = (await registerRes.json()) as any;
    assert(registerRes.ok && registerData.token, 'User registered successfully with JWT token');
    const userToken = registerData.token;
    const userId = registerData.user?.id;

    // Admin login / token setup
    console.log('[2] Authenticating as Admin');
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'help.netbybit@hotmail.com',
        password: 'admin',
      }),
    });
    const adminLoginData = (await adminLoginRes.json()) as any;
    assert(adminLoginRes.ok && adminLoginData.token, 'Admin authenticated and received valid JWT token');
    const adminToken = adminLoginData.token;
    const adminHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };
    const userHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    };

    // 2. Fund user with initial test balances via admin update API
    console.log('[3] Funding user with initial balances: 500 USDT_ERC20, 500 USDT_TRC20, 0.5 ETH, 4,000 TRX');
    await fetch(`${BASE_URL}/api/admin/users/${userId}/balance`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        balances: {
          USDT_ERC20: 500,
          USDT_TRC20: 500,
          ETH: 0.5, // Less than 1 ETH for transfer, less than 0.7 ETH for swap
          TRX: 4000, // Less than 5,500 TRX for swap, less than 10,000 TRX for transfer
          BTC: 0,
          SOL: 0,
        },
      }),
    });

    // 3. Test: Attempt USDT ERC-20 transfer with only 0.5 ETH (< 1 ETH required)
    console.log('[4] Testing insufficient fee validation: USDT ERC-20 transfer with 0.5 ETH');
    const erc20WithdrawFail = await fetch(`${BASE_URL}/api/user/transactions`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        type: 'withdraw',
        asset: 'USDT_ERC20',
        amount: 100,
        destinationAddress: '0x1234567890abcdef1234567890abcdef12345678',
      }),
    });
    const erc20WithdrawFailData = (await erc20WithdrawFail.json()) as any;
    assert(
      erc20WithdrawFail.status === 400 && erc20WithdrawFailData.error?.includes('1 ETH'),
      'Blocked USDT ERC-20 transfer with < 1 ETH requirement'
    );

    // 4. Test: Attempt USDT TRC-20 swap with only 4,000 TRX (< 5,500 TRX required)
    console.log('[5] Testing insufficient fee validation: USDT TRC-20 swap with 4,000 TRX');
    const trc20SwapFail = await fetch(`${BASE_URL}/api/user/transactions`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        type: 'swap',
        asset: 'USDT_TRC20',
        fromAsset: 'USDT_TRC20',
        toAsset: 'BTC',
        amount: 100,
        usdtEquivalent: 100,
      }),
    });
    const trc20SwapFailData = (await trc20SwapFail.json()) as any;
    assert(
      trc20SwapFail.status === 400 &&
        trc20SwapFailData.error ===
          'Network Fee Required: Insufficient Tron (TRX) balance. Kindly deposit 5,500 TRX to complete this swap.',
      'Blocked USDT TRC-20 swap with exact required 5,500 TRX error prompt'
    );

    // 5. Test: Attempt USDT TRC-20 transfer with only 4,000 TRX (< 10,000 TRX required)
    console.log('[6] Testing insufficient fee validation: USDT TRC-20 transfer with 4,000 TRX');
    const trc20WithdrawFail = await fetch(`${BASE_URL}/api/user/transactions`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        type: 'withdraw',
        asset: 'USDT_TRC20',
        amount: 100,
        destinationAddress: 'TX1234567890abcdef1234567890abcdef',
      }),
    });
    const trc20WithdrawFailData = (await trc20WithdrawFail.json()) as any;
    assert(
      trc20WithdrawFail.status === 400 && trc20WithdrawFailData.error?.includes('10,000 TRX'),
      'Blocked USDT TRC-20 transfer with < 10,000 TRX requirement'
    );

    // 6. Fund user with sufficient fees for approval & cancellation testing
    console.log('[7] Funding user with adequate balances: 1000 USDT_ERC20, 1000 USDT_TRC20, 5.0 ETH, 30,000 TRX');
    const fundRes = await fetch(`${BASE_URL}/api/admin/users/${userId}/balance`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        balances: {
          USDT_ERC20: 1000,
          USDT_TRC20: 1000,
          ETH: 5.0,
          TRX: 30000,
          BTC: 0,
          SOL: 0,
        },
      }),
    });
    const fundData = await fundRes.json();
    console.log('Fund response [7]:', fundRes.status, fundData);

    // 7. Test: Create USDT ERC-20 withdrawal (100 USDT, 1 ETH fee reserved) and then CANCEL by Admin
    console.log('[8] Testing USDT ERC-20 Withdrawal creation and Admin Cancellation / Automatic Refund');
    const createErc20Tx = await fetch(`${BASE_URL}/api/user/transactions`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        type: 'withdraw',
        asset: 'USDT_ERC20',
        amount: 100,
        destinationAddress: '0xTestAddressERC20Withdrawal',
      }),
    });
    const erc20TxData = (await createErc20Tx.json()) as any;
    if (!createErc20Tx.ok) {
      console.error('Failed to create ERC20 withdrawal:', createErc20Tx.status, erc20TxData);
    }
    assert(createErc20Tx.ok && erc20TxData.transaction?.id, 'USDT ERC-20 withdrawal created in pending state');
    const erc20TxId = erc20TxData.transaction.id;

    // Helper to get fresh balances from /api/auth/me
    async function getFreshBalances() {
      const meRes = await fetch(`${BASE_URL}/api/auth/me`, { headers: userHeaders });
      const meData = (await meRes.json()) as any;
      return meData.balances || meData.user?.balances || {};
    }

    // Check balances while pending
    const balancesPending1 = await getFreshBalances();
    assert(
      balancesPending1.USDT_ERC20 === 900 && balancesPending1.ETH === 4.0,
      'USDT (100) and ETH fee (1.0) correctly reserved from available balance'
    );

    // Admin Cancels transaction
    console.log(`[9] Admin cancelling transaction #${erc20TxId}`);
    const cancelRes1 = await fetch(`${BASE_URL}/api/admin/transactions/${erc20TxId}/status`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'cancelled' }),
    });
    const cancelData1 = (await cancelRes1.json()) as any;
    assert(cancelRes1.ok && cancelData1.transaction?.status === 'cancelled', 'Transaction marked cancelled by Admin');

    // Verify balance refund
    const balancesAfterCancel1 = await getFreshBalances();
    assert(
      balancesAfterCancel1.USDT_ERC20 === 1000 && balancesAfterCancel1.ETH === 5.0,
      'Both USDT (100) and ETH fee (1.0) automatically refunded in full to active balance'
    );

    // 8. Test: Create USDT TRC-20 Swap (200 USDT_TRC20 with 5,500 TRX fee) and then APPROVE by Admin
    console.log('[10] Testing USDT TRC-20 Swap creation and Admin Approval / Fee Finalization');
    const createTrc20Swap = await fetch(`${BASE_URL}/api/user/transactions`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        type: 'swap',
        asset: 'USDT_TRC20',
        fromAsset: 'USDT_TRC20',
        toAsset: 'BTC',
        amount: 200,
        usdtEquivalent: 200,
      }),
    });
    const swapTxData = (await createTrc20Swap.json()) as any;
    assert(createTrc20Swap.ok && swapTxData.transaction?.id, 'USDT TRC-20 swap created in pending state');
    const swapTxId = swapTxData.transaction.id;

    // Check balances while pending
    const balancesSwapPending = await getFreshBalances();
    assert(
      balancesSwapPending.USDT_TRC20 === 800 && balancesSwapPending.TRX === 24500,
      'USDT (200) and TRX fee (5,500) correctly reserved during pending swap'
    );

    // Admin Approves Swap
    console.log(`[11] Admin approving swap transaction #${swapTxId}`);
    const approveSwapRes = await fetch(`${BASE_URL}/api/admin/transactions/${swapTxId}/status`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'completed' }),
    });
    const approveSwapData = (await approveSwapRes.json()) as any;
    assert(approveSwapRes.ok && approveSwapData.transaction?.status === 'completed', 'Swap marked completed by Admin');

    // Verify converted asset credited and fee permanently deducted
    const balancesAfterSwapApprove = await getFreshBalances();
    assert(
      balancesAfterSwapApprove.USDT_TRC20 === 800 &&
        balancesAfterSwapApprove.TRX === 24500 &&
        balancesAfterSwapApprove.BTC === 200,
      'Target BTC credited (+200), source USDT (200) and TRX network fee (5,500) permanently finalized'
    );

    // 9. Test: Idempotency & Prevent Double Cancellation / Double Spending
    console.log('[12] Testing Idempotency & Security Constraints');
    const reApproveRes = await fetch(`${BASE_URL}/api/admin/transactions/${swapTxId}/status`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'completed' }),
    });
    assert(reApproveRes.ok, 'Re-approval call handled idempotently without re-crediting or error');

    const tryCancelCompleted = await fetch(`${BASE_URL}/api/admin/transactions/${swapTxId}/status`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'cancelled' }),
    });
    assert(
      tryCancelCompleted.status === 400,
      'Security guard prevented cancellation/refund of an already completed transaction'
    );

    // Check balances remain unchanged
    const balancesSecurity = await getFreshBalances();
    assert(
      balancesSecurity.BTC === 200 && balancesSecurity.TRX === 24500,
      'Balances verified stable and uncorrupted after security checks'
    );

    console.log('\n====================================================');
    console.log(`🎉 END-TO-END TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Unhandled error during E2E testing:', error);
    process.exit(1);
  }
}

runEndToEndTests();
