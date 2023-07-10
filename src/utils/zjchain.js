/* eslint-disable */
import { hexToBytes, isHexadecimal } from 'src/utils/string-utils';
import { keccak256 } from 'js-sha3';
import { Secp256k1 } from 'src/utils/secp256k1';
import randomBytes from 'randombytes';
import CryptoJS from 'crypto-js';
import $ from 'jquery';
import ethereumjs from 'src/utils/ethereumjs-tx-1.3.3.min';

import {
    Loading,
    Notify,
} from 'quasar'




// var CryptoJS = require('crypto-js');
console.log(CryptoJS.HmacSHA1("Message", "Key"));



/* eslint-disable */

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

function save_private_key_db(self_private_key) {
    let rand_seckey = Secp256k1.uint256(randomBytes(32));
    const rand_seckeyBuf = Secp256k1.uint256(rand_seckey, 16)
    let keep_seckey;
    keep_seckey = Secp256k1.uint256(rand_seckeyBuf, 16);
    let vk1 = GetValidHexString(keep_seckey)
    let seckey = CryptoJS.SHA256(vk1).toString();
    let valprikey = GetValidHexString(self_private_key);
    let enckey = CryptoJS.AES.encrypt(valprikey, keep_seckey.toString()).toString()//  密文


    console.log("\n seckey:", seckey, ",\n enckey: ", enckey, ",\n valprikey: ", valprikey);

    $.ajax({
        type: 'post',
        async: false,
        url: '/zjchain/set_private_key/',
        data: {
            'key': seckey,
            'enc': enckey
        },
        dataType: "json",
        success: function (result) {
            if (result.status) {
            } else {
            }
        }
    });
    return keep_seckey.toString(16);
}

export  function getStorePassword() {
    var keep_seckey = localStorage.getItem('keepSecKey');
    let self_private_key = '';
    if (keep_seckey) {
        keep_seckey = Secp256k1.uint256(keep_seckey, 16)
        var seckey = CryptoJS.SHA256(GetValidHexString(keep_seckey)).toString();
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
    var str_res = uint256_bytes.toString(16)
    while (str_res.length < 64) {
        str_res = "0" + str_res;
    }

    return str_res;
}
export function do_transaction(fromDate) {
    var data = create_tx(fromDate);
    // 默认选项
    Loading.show();
    $.ajax({
        type: 'post',
        async: true,
        timeout:5000,
        url: 'http://192.168.44.186:8783/transaction',
        data: data,
        dataType: "json",
            success: function (result) {
                Loading.hide()
                Notify.create({
                    color: 'green-4',
                    textColor: 'white',
                    icon: 'cloud_done',
                    message: 'success',
                });
            },
            error:function(xhr){
                Loading.hide()
                const msg = 'status:' + xhr.status + ",    desc:" + xhr.statusText;
                console.log("错误提示： " + msg);
                handleError(msg)

            },
    })
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
    var self_public_key = Secp256k1.generatePublicKeyFromPrivateKeyData(self_private_key);



    var gid = GetValidHexString(Secp256k1.uint256(randomBytes(32)));
    var tx_type = 0;
    var frompk = '04' + self_public_key.x.toString(16) + self_public_key.y.toString(16);
    const MAX_UINT32 = 0xFFFFFFFF;
    var amount_buf = new ethereumjs.Buffer.Buffer(8);
    var big = ~~(amount / MAX_UINT32)
    var low = (amount % MAX_UINT32) - big
    amount_buf.writeUInt32LE(big, 4)
    amount_buf.writeUInt32LE(low, 0)

    var gas_limit_buf = new ethereumjs.Buffer.Buffer(8);
    var big = ~~(gas_limit / MAX_UINT32)
    var low = (gas_limit % MAX_UINT32) - big
    gas_limit_buf.writeUInt32LE(big, 4)
    gas_limit_buf.writeUInt32LE(low, 0)

    var gas_price_buf = new ethereumjs.Buffer.Buffer(8);
    var big = ~~(gas_price / MAX_UINT32)
    var low = (gas_price % MAX_UINT32) - big
    gas_price_buf.writeUInt32LE(big, 4)
    gas_price_buf.writeUInt32LE(low, 0)
    var step_buf = new ethereumjs.Buffer.Buffer(8);
    var big = ~~(tx_type / MAX_UINT32)
    var low = (tx_type % MAX_UINT32) - big
    step_buf.writeUInt32LE(big, 4)
    step_buf.writeUInt32LE(low, 0)

    var message_buf = ethereumjs.Buffer.Buffer.concat(
        [ethereumjs.Buffer.Buffer.from(gid, 'hex'),
            ethereumjs.Buffer.Buffer.from(frompk, 'hex'),
            ethereumjs.Buffer.Buffer.from(to, 'hex'),
            amount_buf, gas_limit_buf, gas_price_buf, step_buf]);
    var kechash = keccak256(message_buf)
    var digest = Secp256k1.uint256(kechash, 16)
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
