import { hexToBytes } from 'src/utils/string-utils';
import 'ethereumjs-tx';
import { keccak256 } from 'js-sha3';
import { Secp256k1 } from 'src/utils/secp256k1';
/* eslint-disable */

export function process_global_private_key(password) {

    var privateKeyBuf = Secp256k1.uint256(password, 16);
    var self_private_key = Secp256k1.uint256(privateKeyBuf, 16);
    var self_public_key = Secp256k1.generatePublicKeyFromPrivateKeyData(self_private_key);
    var pk_bytes = hexToBytes(self_public_key.x.toString(16) + self_public_key.y.toString(16));
    var address = keccak256(pk_bytes);
    const self_account_address = address.slice(address.length - 40, address.length);
    // $.ajax({
    //     type: 'get',
    //     async: false,
    //     url: '/zjchain/get_balance/' + address + '/',
    //     success: function (result) {
    //         if (result.status) {
    //             $('#global_balance').html('<i class="fas fa-map mr-2"></i>' + '0 Ti' + '<span class="float-right text-muted text-sm badge bg-warning">balance</span>');
    //         } else {
    //             var zjchain = Math.floor(result.balance / 10000000) + '.' + result.balance % 10000000;
    //             $('#global_balance').html('<i class="fas fa-map mr-2"></i>' + zjchain + ' Ti<span class="float-right text-muted text-sm badge bg-warning">balance</span>');
    //             local_count_shard_id = result.shard_id;
    //         }
    //     },
    // });

    return {selfAccountAddress:self_account_address, selfPrivateKey:self_private_key, selfPublicKey:self_public_key};
}
