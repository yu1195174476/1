/* eslint-disable */
import { hexToBytes } from 'src/utils/string-utils';
import { keccak256 } from 'js-sha3';
import { Base64 } from 'js-base64';
import { Secp256k1 } from 'src/utils/secp256k1';
import randomBytes from 'randombytes';
import CryptoJS from 'crypto-js';
import $ from 'jquery';
import ethereumjs from 'src/utils/ethereumjs-tx-1.3.3.min';

import { Cookies, Loading, Notify } from 'quasar';
import { save_private_key_db } from 'src/api/zjChainApi';


export function process_global_private_key(password) {

    const privateKeyBuf = Secp256k1.uint256(password, 16);
    const self_private_key = Secp256k1.uint256(privateKeyBuf, 16);
    const self_public_key = Secp256k1.generatePublicKeyFromPrivateKeyData(self_private_key);
    const pk_bytes = hexToBytes(self_public_key.x.toString(16) + self_public_key.y.toString(16));
    const address = keccak256(pk_bytes);
    const self_account_address = address.slice(address.length - 40, address.length);

    const keep_seckey = save_private_key_db(self_private_key);
    return {
        selfAccountAddress:self_account_address,
        selfPrivateKey:self_private_key,
        selfPublicKey:self_public_key,
        keepSecKey:keep_seckey
    }
}

export function getAddressFromPrivateKey(password) {
    if (!password) return '';
    const privateKeyBuf = Secp256k1.uint256(password, 16);
    const self_private_key = Secp256k1.uint256(privateKeyBuf, 16);
    const self_public_key = Secp256k1.generatePublicKeyFromPrivateKeyData(self_private_key);
    const pk_bytes = hexToBytes(self_public_key.x.toString(16) + self_public_key.y.toString(16));
    const address = keccak256(pk_bytes);
    return address.slice(address.length - 40, address.length);
}



export  function getStorePassword() {
    let keep_seckey = localStorage.getItem('keepSecKey');
    let self_private_key = '';
    if (keep_seckey) {
        keep_seckey = Secp256k1.uint256(keep_seckey, 16)
        const seckey = CryptoJS.SHA256(GetValidHexString(keep_seckey)).toString();
        console.log('return seckey:', seckey);
        $.ajax({
            type: 'get',
            async: false,
            url: '/zjchain/get_prikey/' + seckey + '/',
            success: function (result) {
                if (result.status === 0) {
                    self_private_key = CryptoJS.AES.decrypt(result.prikey, keep_seckey.toString()).toString(CryptoJS.enc.Utf8);
                    console.log("return prikey: ", self_private_key)
                } else if (result.msg === "account not exists.") {
                    self_private_key = '';
                }
            }
        });
    }
    return self_private_key;
}


export function GetValidHexString(uint256_bytes) {
    let str_res = uint256_bytes.toString(16);
    while (str_res.length < 64) {
        str_res = "0" + str_res;
    }

    return str_res;
}

export function handleSuccess() {
    Notify.create({
        color: 'green-4',
        textColor: 'white',
        icon: 'cloud_done',
        message: 'success',
    });
}

export function handleError(message) {
    Notify.create({
        color: 'negative',
        message,
        actions: [
            {
                label: 'Error',
                color: 'white',
            },
        ],
    });
}
export function create_tx(fromDate) {
    let to = fromDate.to;
    let amount = fromDate.amount;
    let gas_limit = fromDate.gas_limit;
    let gas_price = fromDate.gas_price;
    let self_private_key = fromDate.self_private_key;
    self_private_key = Secp256k1.uint256(self_private_key, 16);
    const self_public_key = Secp256k1.generatePublicKeyFromPrivateKeyData(self_private_key);


    const gid = GetValidHexString(Secp256k1.uint256(randomBytes(32)));
    const tx_type = 0;
    const frompk = '04' + self_public_key.x.toString(16) + self_public_key.y.toString(16);
    const MAX_UINT32 = 0xFFFFFFFF;
    const amount_buf = new ethereumjs.Buffer.Buffer(8);
    let big = ~~(amount / MAX_UINT32);
    let low = (amount % MAX_UINT32) - big;
    amount_buf.writeUInt32LE(big, 4)
    amount_buf.writeUInt32LE(low, 0)

    const gas_limit_buf = new ethereumjs.Buffer.Buffer(8);
    big = ~~(gas_limit / MAX_UINT32);
    low = (gas_limit % MAX_UINT32) - big;
    gas_limit_buf.writeUInt32LE(big, 4)
    gas_limit_buf.writeUInt32LE(low, 0)

    const gas_price_buf = new ethereumjs.Buffer.Buffer(8);
    big = ~~(gas_price / MAX_UINT32);
    low = (gas_price % MAX_UINT32) - big;
    gas_price_buf.writeUInt32LE(big, 4)
    gas_price_buf.writeUInt32LE(low, 0)
    const step_buf = new ethereumjs.Buffer.Buffer(8);
    big = ~~(tx_type / MAX_UINT32);
    low = (tx_type % MAX_UINT32) - big;
    step_buf.writeUInt32LE(big, 4)
    step_buf.writeUInt32LE(low, 0)

    const message_buf = ethereumjs.Buffer.Buffer.concat(
        [ethereumjs.Buffer.Buffer.from(gid, 'hex'),
            ethereumjs.Buffer.Buffer.from(frompk, 'hex'),
            ethereumjs.Buffer.Buffer.from(to, 'hex'),
            amount_buf, gas_limit_buf, gas_price_buf, step_buf]);
    const kechash = keccak256(message_buf);
    const digest = Secp256k1.uint256(kechash, 16);
    const sig = Secp256k1.ecsign(self_private_key, digest)
    const sigR = Secp256k1.uint256(sig.r, 16)
    const sigS = Secp256k1.uint256(sig.s, 16)
    const pubX = Secp256k1.uint256(self_public_key.x, 16)
    const pubY = Secp256k1.uint256(self_public_key.y, 16)
    return {
        'gid': gid,
        'pubkey': '04' + pubX.toString(16) + pubY.toString(16),
        'to': to,
        'amount': amount,
        'gas_limit': gas_limit,
        'gas_price': gas_price,
        'type': tx_type,
        'shard_id': 3,
        'sign_r': sigR.toString(16),
        'sign_s': sigS.toString(16),
        'sign_v': sig.v,
    }
}

export function create_call_function(dataContext) {
    const gid = dataContext.gid;
    const to = dataContext.to;
    const gas_limit = dataContext.gas_limit;
    const gas_price = dataContext.gas_price;
    const tx_type = dataContext.tx_type;
    const self_account_id = dataContext.self_account_id;
    const functionValBytes = dataContext.functionValBytes;
    const self_private_key = dataContext.self_private_key;
    const self_public_key = dataContext.self_public_key;
    const local_count_shard_id = dataContext.local_count_shard_id;

    let msg = gid + "-" +
        self_account_id.toString(16) + "-" +
        to + "-" +
        '0' + "-" +
        gas_limit + "-" +
        gas_price + "-" +
        tx_type.toString() + "-";
    msg += str_to_hex("__cinput") + functionValBytes;
    var kechash = keccak256(msg)
    var digest = Secp256k1.uint256(kechash, 16)
    const sig = Secp256k1.ecsign(self_private_key, digest)
    const sigR = Secp256k1.uint256(sig.r, 16)
    const sigS = Secp256k1.uint256(sig.s, 16)
    const pubX = Secp256k1.uint256(self_public_key.x, 16)
    const pubY = Secp256k1.uint256(self_public_key.y, 16)
    const isValidSig = Secp256k1.ecverify(pubX, pubY, sigR, sigS, digest)
    if (!isValidSig) {
        handleError("signature transaction failed.");
        return;
    }

    return {
        'gid': gid,
        'frompk': '04' + self_public_key.x.toString(16) + self_public_key.y.toString(16),
        'to': to,
        'amount': 0,
        'gas_limit': gas_limit,
        'gas_price': gas_price,
        'type': tx_type,
        'shard_id': local_count_shard_id,
        'hash': kechash,
        'attrs_size': 1,
        'key0': str_to_hex('__cinput'),
        "val0": functionValBytes,
        'sigr': sigR.toString(16),
        'sigs': sigS.toString(16)
    }
}

export function create_contract(gid, to, formData) {
    const self_account_id = formData.selfAddress;
    const amount = formData.amount;
    const gas_limit = formData.gas_limit;
    const gas_price = formData.gas_price;
    const contract_src = Base64.encode(formData.sorce_codes);
    const self_private_key = formData.self_private_key;
    const self_public_key = formData.selfPublicKey;

    const tx_type = 4;
    let msg = gid + '-' +
        self_account_id.toString(16) + '-' +
        to + '-' +
        amount + '-' +
        gas_limit + '-' +
        gas_price + '-' +
        tx_type.toString() + '-';
    msg += str_to_hex('__cbytescode') + formData.contract_bytes;
    msg += str_to_hex('__csourcecode') + str_to_hex(contract_src);
    msg += str_to_hex('__ctname') + str_to_hex(formData.contract_name);
    msg += str_to_hex('__ctdesc') + str_to_hex(formData.contract_desc);
    const kechash = keccak256(msg);
    const digest = Secp256k1.uint256(kechash, 16);
    const sig = Secp256k1.ecsign(self_private_key, digest)
    const sigR = Secp256k1.uint256(sig.r, 16)
    const sigS = Secp256k1.uint256(sig.s, 16)
    const pubX = Secp256k1.uint256(self_public_key.x, 16)
    const pubY = Secp256k1.uint256(self_public_key.y, 16)
    const isValidSig = Secp256k1.ecverify(pubX, pubY, sigR, sigS, digest)
    if (!isValidSig) {
        handleError('signature transaction failed.');
        return;
    }

    return {
        'gid': gid,
        'frompk': '04' + self_public_key.x.toString(16) + self_public_key.y.toString(16),
        'to': to,
        'amount': amount,
        'gas_limit': gas_limit,
        'gas_price': gas_price,
        'type': tx_type,
        'shard_id': formData.local_account_shard_id,
        'hash': kechash,
        'attrs_size': 4,
        'key0': str_to_hex('__cbytescode'),
        'key1': str_to_hex('__csourcecode'),
        'key2': str_to_hex('__ctname'),
        'key3': str_to_hex('__ctdesc'),
        "val0": formData.contract_bytes,
        "val1": str_to_hex(contract_src),
        "val2": str_to_hex(formData.contract_name),
        "val3": str_to_hex(formData.contract_desc),
        'sigr': sigR.toString(16),
        'sigs': sigS.toString(16)
    }
}

function str_to_hex(str) {
    const arr1 = [];
    for (let n = 0; n < str.length; n++) {
        const hex = Number(str.charCodeAt(n)).toString(16);
        arr1.push(hex);
    }
    return arr1.join('');
}

