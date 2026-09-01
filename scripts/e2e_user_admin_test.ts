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
    console.log('[8] Testing USDT ERC-20 Withdrawal creation and Admin Cancellation / Full Refund (100 USDT + 1 ETH)');
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
    console.log(`[9] Admin cancelling ERC-20 withdrawal transaction #${erc20TxId}`);
    const cancelRes1 = await fetch(`${BASE_URL}/api/admin/transactions/${erc20TxId}/status`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'cancelled' }),
    });
    const cancelData1 = (await cancelRes1.json()) as any;
    assert(cancelRes1.ok && cancelData1.transaction?.status === 'cancelled', 'Transaction marked cancelled by Admin');
    assert(cancelData1.transaction?.refundStatus === 'refunded', 'Database refundStatus recorded as "refunded"');
    assert(cancelData1.transaction?.feeStatus === 'released', 'Database feeStatus recorded as "released"');
    assert(cancelData1.transaction?.feeRefunded === 1.0, 'Database feeRefunded recorded as 1.0 ETH');

    // Verify balance refund
    const balancesAfterCancel1 = await getFreshBalances();
    assert(
      balancesAfterCancel1.USDT_ERC20 === 1000 && balancesAfterCancel1.ETH === 5.0,
      'Both USDT (100) and 1 ETH network fee automatically refunded in full to active balance'
    );

    // Test Idempotency: Cancel same transaction second time
    console.log(`[10] Testing Idempotency: Cancelling transaction #${erc20TxId} a second time`);
    const cancelRes1Duplicate = await fetch(`${BASE_URL}/api/admin/transactions/${erc20TxId}/status`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'cancelled' }),
    });
    assert(cancelRes1Duplicate.ok, 'Duplicate cancellation handled idempotently without throwing error');
    const balancesAfterDuplicateCancel = await getFreshBalances();
    assert(
      balancesAfterDuplicateCancel.USDT_ERC20 === 1000 && balancesAfterDuplicateCancel.ETH === 5.0,
      'Duplicate cancellation did NOT double-refund funds (Idempotency strictly preserved)'
    );

    // 8. Test: TRC-20 transfer cancellation -> 10,000 TRX network fee + 150 USDT refunded
    console.log('[11] Testing USDT TRC-20 Transfer creation and Cancellation / Full Refund (150 USDT + 10,000 TRX)');
    const createTrc20Transfer = await fetch(`${BASE_URL}/api/user/transactions`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        type: 'withdraw',
        asset: 'USDT_TRC20',
        amount: 150,
        destinationAddress: 'TX_TRC20_Test_Dest',
      }),
    });
    const trc20TxData = (await createTrc20Transfer.json()) as any;
    assert(createTrc20Transfer.ok && trc20TxData.transaction?.id, 'USDT TRC-20 transfer created');
    const trc20TxId = trc20TxData.transaction.id;

    const balancesTrc20Pending = await getFreshBalances();
    assert(
      balancesTrc20Pending.USDT_TRC20 === 850 && balancesTrc20Pending.TRX === 20000,
      'USDT (150) and TRX fee (10,000) correctly reserved'
    );

    // Admin cancels TRC-20 transfer
    const cancelTrc20Res = await fetch(`${BASE_URL}/api/admin/transactions/${trc20TxId}/status`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'cancelled' }),
    });
    const cancelTrc20Data = (await cancelTrc20Res.json()) as any;
    assert(cancelTrc20Res.ok && cancelTrc20Data.transaction?.status === 'cancelled', 'TRC-20 transfer marked cancelled');
    assert(cancelTrc20Data.transaction?.feeRefunded === 10000, 'Database recorded 10,000 TRX fee refunded');

    const balancesAfterTrc20Cancel = await getFreshBalances();
    assert(
      balancesAfterTrc20Cancel.USDT_TRC20 === 1000 && balancesAfterTrc20Cancel.TRX === 30000,
      'Both 150 USDT and 10,000 TRX network fee fully restored upon cancellation'
    );

    // 9. Test: ERC-20 Swap cancellation -> 0.7 ETH fee + 120 USDT_ERC20 refunded
    console.log('[12] Testing USDT ERC-20 Swap creation and Cancellation / Full Refund (120 USDT + 0.7 ETH)');
    const createErc20Swap = await fetch(`${BASE_URL}/api/user/transactions`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        type: 'swap',
        asset: 'USDT_ERC20',
        fromAsset: 'USDT_ERC20',
        toAsset: 'BTC',
        amount: 120,
        usdtEquivalent: 120,
      }),
    });
    const erc20SwapData = (await createErc20Swap.json()) as any;
    assert(createErc20Swap.ok && erc20SwapData.transaction?.id, 'USDT ERC-20 swap created');
    const erc20SwapId = erc20SwapData.transaction.id;

    const balancesErc20SwapPending = await getFreshBalances();
    assert(
      balancesErc20SwapPending.USDT_ERC20 === 880 && balancesErc20SwapPending.ETH === 4.3,
      'USDT (120) and ETH fee (0.7) reserved during pending swap'
    );

    const cancelErc20SwapRes = await fetch(`${BASE_URL}/api/admin/transactions/${erc20SwapId}/status`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'cancelled' }),
    });
    const cancelErc20SwapData = (await cancelErc20SwapRes.json()) as any;
    assert(cancelErc20SwapRes.ok && cancelErc20SwapData.transaction?.status === 'cancelled', 'ERC-20 swap marked cancelled');
    assert(cancelErc20SwapData.transaction?.feeRefunded === 0.7, 'Database recorded 0.7 ETH fee refunded');

    const balancesAfterErc20SwapCancel = await getFreshBalances();
    assert(
      balancesAfterErc20SwapCancel.USDT_ERC20 === 1000 && balancesAfterErc20SwapCancel.ETH === 5.0,
      'Both 120 USDT and 0.7 ETH swap fee fully restored upon cancellation'
    );

    // 10. Test: TRC-20 Swap cancellation -> 5,500 TRX fee + 200 USDT_TRC20 refunded
    console.log('[13] Testing USDT TRC-20 Swap creation and Cancellation / Full Refund (200 USDT + 5,500 TRX)');
    const createTrc20SwapCancel = await fetch(`${BASE_URL}/api/user/transactions`, {
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
    const trc20SwapCancelData = (await createTrc20SwapCancel.json()) as any;
    assert(createTrc20SwapCancel.ok && trc20SwapCancelData.transaction?.id, 'USDT TRC-20 swap created');
    const trc20SwapCancelId = trc20SwapCancelData.transaction.id;

    const balancesTrc20SwapCancelPending = await getFreshBalances();
    assert(
      balancesTrc20SwapCancelPending.USDT_TRC20 === 800 && balancesTrc20SwapCancelPending.TRX === 24500,
      'USDT (200) and TRX fee (5,500) reserved during pending swap'
    );

    const cancelTrc20SwapRes = await fetch(`${BASE_URL}/api/admin/transactions/${trc20SwapCancelId}/status`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'cancelled' }),
    });
    const cancelTrc20SwapData = (await cancelTrc20SwapRes.json()) as any;
    assert(cancelTrc20SwapRes.ok && cancelTrc20SwapData.transaction?.status === 'cancelled', 'TRC-20 swap marked cancelled');
    assert(cancelTrc20SwapData.transaction?.feeRefunded === 5500, 'Database recorded 5,500 TRX fee refunded');

    const balancesAfterTrc20SwapCancel = await getFreshBalances();
    assert(
      balancesAfterTrc20SwapCancel.USDT_TRC20 === 1000 && balancesAfterTrc20SwapCancel.TRX === 30000,
      'Both 200 USDT and 5,500 TRX swap fee fully restored upon cancellation'
    );

    // 11. Test: Create USDT TRC-20 Swap (200 USDT_TRC20 with 5,500 TRX fee) and then APPROVE by Admin
    console.log('[14] Testing USDT TRC-20 Swap creation and Admin Approval / Fee Finalization');
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
    console.log(`[15] Admin approving swap transaction #${swapTxId}`);
    const approveSwapRes = await fetch(`${BASE_URL}/api/admin/transactions/${swapTxId}/status`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'completed' }),
    });
    const approveSwapData = (await approveSwapRes.json()) as any;
    assert(approveSwapRes.ok && approveSwapData.transaction?.status === 'completed', 'Swap marked completed by Admin');
    assert(approveSwapData.transaction?.feeStatus === 'finalized', 'Database feeStatus recorded as "finalized"');
    assert(approveSwapData.transaction?.refundStatus === 'not_applicable', 'Database refundStatus recorded as "not_applicable"');

    // Verify converted asset credited and fee permanently finalized
    const balancesAfterSwapApprove = await getFreshBalances();
    assert(
      balancesAfterSwapApprove.USDT_TRC20 === 800 &&
        balancesAfterSwapApprove.TRX === 24500 &&
        balancesAfterSwapApprove.BTC === 200,
      'Target BTC credited (+200), source USDT (200) and TRX network fee (5,500) permanently finalized'
    );

    // 12. Test: Idempotency & Prevent Double Cancellation / Double Spending
    console.log('[16] Testing Idempotency & Security Constraints');
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
