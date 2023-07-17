/* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions,@typescript-eslint/no-unsafe-assignment */
import { Loading } from 'quasar';
import $ from 'jquery';
import {
    create_call_function,
    create_contract,
    create_tx,
    GetValidHexString,
    handleError,
    handleSuccess,
} from 'src/utils/zjUtils';
import { Secp256k1 } from 'src/utils/secp256k1';
import randomBytes from 'randombytes';
import CryptoJS from 'crypto-js';
import { keccak256 } from 'js-sha3';

const controller = new AbortController();

export function do_transaction(fromDate) {
    const data = create_tx(fromDate);
    controller.abort();
    // 默认选项
    Loading.show();
    $.ajax({
        type: 'post',
        async: true,
        timeout:10000,
        url: '/chain_server/transaction',
        data: data,
        dataType: 'json',
        success: function (result) {
            Loading.hide();
            handleSuccess();
            console.log(`do_transaction handleSuccess ${result.toString()}`);
        },
        error:function(xhr){
            Loading.hide();
            if (xhr.statusText === 'OK') {
                handleSuccess();
                return;
            }
            const msg = `status:${xhr.status},    desc:${xhr.statusText}`;
            console.log('错误提示： ' + msg);
            handleError(msg);
        },
    });
}

export async function do_create_contract(formDate) {
    const self_account_id = formDate.selfAddress;
    const gid = GetValidHexString(Secp256k1.uint256(randomBytes(32)));
    const contract_bytes = formDate.contract_bytes;
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    const kechash = keccak256(self_account_id + gid + contract_bytes);
    let self_contract_address = kechash.slice(kechash.length - 40, kechash.length);
    const data = create_contract(
        gid,
        self_contract_address.toString(16),
        formDate);

    return new Promise((resolve) => {
        $.ajax({
            type: 'post',
            async: true,
            url: '/chain_server/do_transaction/',
            data: data,
            timeout: 5000,
            dataType: 'json',
            success: function (response) {
                Loading.hide();
                if (response.status === 0) {
                    handleSuccess();
                    resolve(self_contract_address.toString(16));
                } else {
                    handleError('do_transaction failed');
                    resolve('');
                }
            },
            error: function (xhr) {
                Loading.hide();
                const msg = `status:${xhr.status},    desc:${xhr.statusText}`;
                console.log('错误提示： ' + msg);
                handleError(msg);
                resolve('');
            },
        });
    });
}

export async function call_contract_function(dataContext) {


    dataContext.gid = GetValidHexString(Secp256k1.uint256(randomBytes(32)));
    const data = create_call_function(dataContext);

    await new Promise((resolve) => {
        $.ajax({
            type: 'post',
            async: true,
            url: '/chain_server/do_transaction/',
            data: data,
            dataType: 'json',
            success: function (response) {
                Loading.hide();
                if (response.status === 0) {
                    handleSuccess();
                } else {
                    handleError('do_transaction failed');
                }
                resolve();
            },
            error: function (xhr) {
                Loading.hide();
                const msg = `status:${xhr.status},    desc:${xhr.statusText}`;
                console.log('错误提示： ' + msg);
                handleError(msg);
                resolve();
            },

        });
    });
}


export function save_private_key_db(self_private_key) {
    let rand_seckey = Secp256k1.uint256(randomBytes(32));
    const rand_seckeyBuf = Secp256k1.uint256(rand_seckey, 16);
    let keep_seckey;
    keep_seckey = Secp256k1.uint256(rand_seckeyBuf, 16);
    let vk1 = GetValidHexString(keep_seckey);
    let seckey = CryptoJS.SHA256(vk1).toString();
    let valprikey = GetValidHexString(self_private_key);
    let enckey = CryptoJS.AES.encrypt(valprikey, keep_seckey.toString()).toString();//  密文


    console.log('\n seckey:', seckey, ',\n enckey: ', enckey, ',\n valprikey: ', valprikey);

    $.ajax({
        type: 'post',
        async: false,
        url: '/zjchain/set_private_key/',
        data: {
            'key': seckey,
            'enc': enckey,
        },
        dataType: 'json',
        success: function (result) {
            if (result.status) {
            } else {
            }
        },
    });
    return keep_seckey.toString(16);
}

export  function getStorePassword() {
    controller.abort();
    let keep_seckey = localStorage.getItem('keepSecKey');
    return new Promise((resolve) => {
        if (keep_seckey) {
            keep_seckey = Secp256k1.uint256(keep_seckey, 16);
            const seckey = CryptoJS.SHA256(GetValidHexString(keep_seckey)).toString();
            console.log('return seckey:', seckey);
            $.ajax({
                type: 'get',
                async:true,
                timeout:2000,
                url: '/zjchain/get_prikey/' + seckey + '/',
                success: function (result) {
                    if (result.status === 0) {
                        const self_private_key = CryptoJS.AES.decrypt(result.prikey, keep_seckey.toString()).toString(CryptoJS.enc.Utf8);
                        console.log('return prikey: ', self_private_key);
                        resolve(self_private_key);
                    } else if (result.msg === 'account not exists.') {
                        resolve('');
                    }
                },
                error: function (xhr) {
                    Loading.hide();
                    const msg = `status:${xhr.status},    desc:${xhr.statusText}`;
                    console.log('错误提示： ' + msg);
                    handleError(msg);
                    resolve('');
                },
            });
        } else {
            resolve('');
        }
    });
}

