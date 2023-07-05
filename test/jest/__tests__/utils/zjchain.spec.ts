import { describe, it } from '@jest/globals';
import CryptoJS from 'crypto-js';


describe('zjchain functions', () => {
    describe('process_global_private_key', () => {
        it('save_private_key', () => {

            const valprikey = '0000000000000000000000000000000000000000000000000000000019088469';
            const seckey = 'd06be2ebe36dd75bcd1ab76a3ca7fd63019c20e3ef8aaae2b3828077931782c0';
            const enckey = CryptoJS.AES.encrypt(valprikey, seckey).toString();//  密文
            const decseckey = CryptoJS.AES.decrypt(enckey, seckey).toString(CryptoJS.enc.Utf8);
            console.log(enckey);
            console.log(decseckey);
            // expect(isValidAccount(validAntelopeAccount)).toBe(true);
        });
    });
});
