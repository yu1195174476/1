import { describe, expect, it } from '@jest/globals';
import {
    assetToAmount,
    formatCurrency,
    formatDate, getRexHistoryAsset,
    isValidAccount,
    isValidTransactionHex,
} from 'src/utils/string-utils';
import { process_global_private_key } from 'src/utils/zjchain';
import BN from 'bn.js';
import { PublicKey } from 'src/store/account/state';
describe('zjchain functions', () => {
    describe('process_global_private_key', () => {
        it('process_global_private_key', () => {
            const password = 'abcdef12345';
            const {
                selfAccountAddress,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                selfPrivateKey,
                selfPublicKey,
            }: {
                selfAccountAddress: string;
                selfPrivateKey: BN;
                selfPublicKey: PublicKey; // Update with the actual type
            } = process_global_private_key(password);
            console.log(selfAccountAddress, selfPrivateKey, selfPublicKey);
            // expect(isValidAccount(validAntelopeAccount)).toBe(true);
        });
    });
});
