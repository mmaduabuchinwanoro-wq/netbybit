import { getRequiredNetworkFee } from '../src/types';

// Standalone simulation tests matching server logic
async function runTests() {
  console.log('--- Starting Network Fee & Transaction State Integrity Tests ---');
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

  // Test 1: Helper fee resolution
  const erc20TransferFee = getRequiredNetworkFee('withdraw', 'USDT_ERC20');
  assert(erc20TransferFee?.feeAsset === 'ETH' && erc20TransferFee?.feeAmount === 1, 'ERC-20 transfer fee is 1 ETH');

  const trc20TransferFee = getRequiredNetworkFee('send', 'USDT_TRC20');
  assert(trc20TransferFee?.feeAsset === 'TRX' && trc20TransferFee?.feeAmount === 10000, 'TRC-20 transfer fee is 10,000 TRX');

  const erc20SwapFee = getRequiredNetworkFee('swap', 'USDT_ERC20', 'USDT_ERC20');
  assert(erc20SwapFee?.feeAsset === 'ETH' && erc20SwapFee?.feeAmount === 0.7, 'ERC-20 swap fee is 0.7 ETH');

  const trc20SwapFee = getRequiredNetworkFee('swap', 'USDT_TRC20', 'USDT_TRC20');
  assert(
    trc20SwapFee?.feeAsset === 'TRX' &&
    trc20SwapFee?.feeAmount === 5500 &&
    trc20SwapFee?.errorMessage === 'Network Fee Required: Insufficient Tron (TRX) balance. Kindly deposit 5,500 TRX to complete this swap.',
    'TRC-20 swap fee is 5,500 TRX with exact required message'
  );

  // State Simulation: User with balances
  type Balances = Record<string, number>;
  function createUser(balances: Partial<Balances>) {
    return {
      id: 'test_usr_' + Math.random(),
      balances: {
        BTC: 0,
        ETH: 0,
        BNB: 0,
        SOL: 0,
        TRX: 0,
        USDT_ERC20: 0,
        USDT_TRC20: 0,
        ...balances,
      } as Record<string, number>,
    };
  }

  // Simulation of transaction creation
  function createTx(user: any, type: string, asset: string, amount: number, fromAsset?: string, toAsset?: string) {
    const targetAsset = type === 'swap' ? (fromAsset || asset) : asset;
    let feeAsset: string | undefined;
    let feeAmount = 0;

    if (type === 'swap') {
      if (targetAsset === 'USDT_ERC20') {
        feeAsset = 'ETH';
        feeAmount = 0.7;
        if ((user.balances['ETH'] || 0) < 0.7) {
          return { error: 'Network Fee Required: Insufficient Ethereum (ETH) balance. Kindly deposit 0.7 ETH to complete this swap.' };
        }
      } else if (targetAsset === 'USDT_TRC20') {
        feeAsset = 'TRX';
        feeAmount = 5500;
        if ((user.balances['TRX'] || 0) < 5500) {
          return { error: 'Network Fee Required: Insufficient Tron (TRX) balance. Kindly deposit 5,500 TRX to complete this swap.' };
        }
      }
    } else if (['withdraw', 'send'].includes(type)) {
      if (targetAsset === 'USDT_ERC20') {
        feeAsset = 'ETH';
        feeAmount = 1;
        if ((user.balances['ETH'] || 0) < 1) {
          return { error: 'Network Fee Required: Insufficient Ethereum (ETH) balance. Kindly deposit 1 ETH to cover the network fee.' };
        }
      } else if (targetAsset === 'USDT_TRC20') {
        feeAsset = 'TRX';
        feeAmount = 10000;
        if ((user.balances['TRX'] || 0) < 10000) {
          return { error: 'Network Fee Required: Insufficient Tron (TRX) balance. Kindly deposit 10,000 TRX to cover the network fees.' };
        }
      }
    }

    const principalAsset = type === 'swap' ? (fromAsset || asset) : asset;
    const currentPrincipalBal = user.balances[principalAsset] || 0;
    if (amount > currentPrincipalBal) {
      return { error: `Insufficient ${principalAsset} balance` };
    }

    // Reserve principal
    user.balances[principalAsset] = Number(Math.max(0, currentPrincipalBal - amount).toFixed(8));

    // Reserve fee
    if (feeAsset && feeAmount > 0) {
      const currentFeeBal = user.balances[feeAsset] || 0;
      user.balances[feeAsset] = Number(Math.max(0, currentFeeBal - feeAmount).toFixed(8));
    }

    return {
      success: true,
      tx: {
        id: 'tx_test_' + Math.random(),
        userId: user.id,
        type,
        asset: principalAsset,
        amount,
        fromAsset,
        toAsset,
        status: 'pending',
        feeAsset,
        feeAmount,
        feeStatus: feeAmount > 0 ? 'reserved' : undefined,
        isFeeFinalized: false,
        isRefunded: false,
      },
    };
  }

  // Simulation of Admin Approval
  function approveTx(user: any, tx: any) {
    if (tx.isRefunded || tx.status === 'cancelled') {
      return { error: 'Cannot approve cancelled transaction' };
    }
    if (tx.status === 'completed' || tx.isFeeFinalized) {
      return { success: true, message: 'Already approved' }; // idempotent
    }

    if (tx.type === 'swap') {
      const targetAsset = tx.toAsset || 'USDT_TRC20';
      user.balances[targetAsset] = Number(((user.balances[targetAsset] || 0) + tx.amount).toFixed(8));
    }
    // For withdraw / send: principal & fee already reserved at creation, so no double deduction

    if (tx.feeAmount > 0) {
      tx.feeStatus = 'finalized';
    }
    tx.isFeeFinalized = true;
    tx.status = 'completed';
    return { success: true };
  }

  // Simulation of Admin Cancellation
  function cancelTx(user: any, tx: any) {
    if (tx.status === 'completed' || tx.isFeeFinalized) {
      return { error: 'Cannot cancel completed transaction' };
    }
    if (tx.isRefunded || tx.status === 'cancelled') {
      return { error: 'Already refunded' }; // prevent duplicate refund
    }

    const principalAsset = tx.type === 'swap' ? (tx.fromAsset || tx.asset) : tx.asset;
    user.balances[principalAsset] = Number(((user.balances[principalAsset] || 0) + tx.amount).toFixed(8));

    if (tx.feeAsset && tx.feeAmount > 0 && tx.feeStatus === 'reserved') {
      user.balances[tx.feeAsset] = Number(((user.balances[tx.feeAsset] || 0) + tx.feeAmount).toFixed(8));
      tx.feeStatus = 'released';
      tx.feeRefunded = tx.feeAmount;
    }

    tx.status = 'cancelled';
    tx.isRefunded = true;
    return { success: true };
  }

  // Test Case 1: ERC-20 transfer with less than 1 ETH
  {
    const u = createUser({ USDT_ERC20: 500, ETH: 0.8 });
    const res = createTx(u, 'send', 'USDT_ERC20', 100);
    assert(res.error?.includes('1 ETH'), 'Reject ERC-20 transfer with < 1 ETH');
    assert(u.balances.USDT_ERC20 === 500 && u.balances.ETH === 0.8, 'Balance unchanged when rejected');
  }

  // Test Case 2: ERC-20 transfer with exactly 1 ETH - Success & Finalization
  {
    const u = createUser({ USDT_ERC20: 500, ETH: 1.0 });
    const res = createTx(u, 'withdraw', 'USDT_ERC20', 200);
    assert(res.success === true, 'Allow ERC-20 transfer with exactly 1 ETH');
    assert(u.balances.USDT_ERC20 === 300, 'USDT balance reserved to 300');
    assert(u.balances.ETH === 0, 'ETH balance reserved to 0');
    
    // Approve
    const appRes = approveTx(u, res.tx);
    assert(appRes.success === true, 'Approve ERC-20 transfer');
    assert(u.balances.USDT_ERC20 === 300 && u.balances.ETH === 0, 'No double deduction on approval');
    assert(res.tx.status === 'completed' && res.tx.feeStatus === 'finalized', 'Tx completed & fee finalized');
  }

  // Test Case 3: ERC-20 transfer with >= 1 ETH - Cancellation & Full Refund
  {
    const u = createUser({ USDT_ERC20: 500, ETH: 2.5 });
    const res = createTx(u, 'send', 'USDT_ERC20', 100);
    assert(u.balances.USDT_ERC20 === 400 && u.balances.ETH === 1.5, 'Balances reserved during pending');
    
    const canRes = cancelTx(u, res.tx);
    assert(canRes.success === true, 'Cancel ERC-20 transfer');
    assert(u.balances.USDT_ERC20 === 500, 'USDT refunded to 500');
    assert(u.balances.ETH === 2.5, 'ETH gas fee 1 ETH released back to 2.5');
    assert(res.tx.feeStatus === 'released' && res.tx.isRefunded === true, 'Fee marked released');

    // Duplicate cancellation attempt
    const dupCancel = cancelTx(u, res.tx);
    assert(dupCancel.error?.includes('Already refunded'), 'Prevent duplicate refund on second cancel attempt');
    assert(u.balances.ETH === 2.5 && u.balances.USDT_ERC20 === 500, 'Balance untouched on duplicate cancel');
  }

  // Test Case 4: ERC-20 swap with less than 0.7 ETH
  {
    const u = createUser({ USDT_ERC20: 1000, ETH: 0.5 });
    const res = createTx(u, 'swap', 'USDT_ERC20', 500, 'USDT_ERC20', 'BTC');
    assert(res.error?.includes('0.7 ETH'), 'Reject ERC-20 swap with < 0.7 ETH');
  }

  // Test Case 5: ERC-20 swap with exactly 0.7 ETH - Successful Swap
  {
    const u = createUser({ USDT_ERC20: 1000, ETH: 0.7, BTC: 0 });
    const res = createTx(u, 'swap', 'USDT_ERC20', 500, 'USDT_ERC20', 'BTC');
    assert(res.success === true, 'Allow ERC-20 swap with exactly 0.7 ETH');
    assert(u.balances.USDT_ERC20 === 500 && u.balances.ETH === 0, 'Balances reserved');

    approveTx(u, res.tx);
    assert(u.balances.BTC === 500, 'BTC credited');
    assert(u.balances.ETH === 0, '0.7 ETH fee permanently deducted');
  }

  // Test Case 6: ERC-20 swap - Cancellation restores 0.7 ETH
  {
    const u = createUser({ USDT_ERC20: 1000, ETH: 1.0, BTC: 0 });
    const res = createTx(u, 'swap', 'USDT_ERC20', 500, 'USDT_ERC20', 'BTC');
    assert(u.balances.ETH === 0.3, '0.7 ETH reserved');

    cancelTx(u, res.tx);
    assert(u.balances.USDT_ERC20 === 1000, 'USDT restored to 1000');
    assert(u.balances.ETH === 1.0, '0.7 ETH fee returned to 1.0 ETH');
  }

  // Test Case 7: TRC-20 swap with less than 5,500 TRX
  {
    const u = createUser({ USDT_TRC20: 1000, TRX: 4000 });
    const res = createTx(u, 'swap', 'USDT_TRC20', 200, 'USDT_TRC20', 'SOL');
    assert(
      res.error === 'Network Fee Required: Insufficient Tron (TRX) balance. Kindly deposit 5,500 TRX to complete this swap.',
      'Reject TRC-20 swap with < 5500 TRX with EXACT specified string'
    );
  }

  // Test Case 8: TRC-20 swap with exactly 5,500 TRX - Approval & Cancellation
  {
    const u = createUser({ USDT_TRC20: 1000, TRX: 5500, SOL: 0 });
    const res = createTx(u, 'swap', 'USDT_TRC20', 300, 'USDT_TRC20', 'SOL');
    assert(res.success === true, 'Allow TRC-20 swap with 5,500 TRX');
    assert(u.balances.TRX === 0, 'TRX reserved to 0');
    assert(u.balances.USDT_TRC20 === 700, 'USDT reserved to 700');

    cancelTx(u, res.tx);
    assert(u.balances.USDT_TRC20 === 1000, 'USDT restored to 1000');
    assert(u.balances.TRX === 5500, '5,500 TRX restored to 5500');
  }

  // Test Case 9: TRC-20 transfer with less than 10,000 TRX
  {
    const u = createUser({ USDT_TRC20: 500, TRX: 8000 });
    const res = createTx(u, 'withdraw', 'USDT_TRC20', 100);
    assert(res.error?.includes('10,000 TRX'), 'Reject TRC-20 transfer with < 10,000 TRX');
  }

  // Test Case 10: TRC-20 transfer with exactly 10,000 TRX
  {
    const u = createUser({ USDT_TRC20: 500, TRX: 10000 });
    const res = createTx(u, 'send', 'USDT_TRC20', 250);
    assert(res.success === true, 'Allow TRC-20 transfer with 10,000 TRX');
    assert(u.balances.USDT_TRC20 === 250 && u.balances.TRX === 0, 'Balances reserved');

    approveTx(u, res.tx);
    assert(u.balances.USDT_TRC20 === 250 && u.balances.TRX === 0, '10,000 TRX permanently deducted');
  }

  // Test Case 11: Idempotency & Re-approval guard
  {
    const u = createUser({ USDT_ERC20: 100, ETH: 2.0 });
    const res = createTx(u, 'withdraw', 'USDT_ERC20', 50);
    approveTx(u, res.tx);
    assert(u.balances.ETH === 1.0 && u.balances.USDT_ERC20 === 50, 'Balances after first approval');

    // Second approval (e.g. duplicate webhook / page refresh)
    approveTx(u, res.tx);
    assert(u.balances.ETH === 1.0 && u.balances.USDT_ERC20 === 50, 'Balances unchanged on duplicate approval');

    // Attempt to cancel an already completed transaction
    const cancelCompleted = cancelTx(u, res.tx);
    assert(cancelCompleted.error?.includes('Cannot cancel completed'), 'Cannot cancel already completed tx');
    assert(u.balances.ETH === 1.0 && u.balances.USDT_ERC20 === 50, 'No refund for completed tx');
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
