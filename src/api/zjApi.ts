import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

import { TransactionFilter, ZjResponse, Transaction } from 'src/types/zj_tpyes/Transaction';
import { applyDefaultFilter, Block, CommonFilter } from 'src/types/zj_tpyes/Block';
import { ChainInfoResponse } from 'src/types/zj_tpyes/ChainInfo';
import { Account } from 'src/types/zj_tpyes/Account';
import { AccountKeyValue } from 'src/types/zj_tpyes/AccountKeyValue';


const endpoint = '/zjchain/';

// endpoint = 'http://localhost:8000/zjchain/';

function getEndpoint() {
    return endpoint;
}


export const zjAxios = axios.create({ baseURL: getEndpoint() });
const controller = new AbortController();

export const getTransactions = async function (
    filter: TransactionFilter,
): Promise<AxiosResponse<ZjResponse<Transaction>>> {
    controller.abort();
    const query = filter.query || '';
    const account = filter.account || '';
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = Math.max(0, page - 1) * limit;
    const notified = filter.notified || '';
    const sort = filter.sort || 'desc';
    const after = filter.after || '';
    const before = filter.before || '';

    let aux = {};
    if (account) {
        aux = { account, ...aux };
    }
    if (limit) {
        aux = { limit, ...aux };
    }
    if (skip) {
        aux = { skip, ...aux };
    }
    if (notified) {
        aux = { notified, ...aux };
    }
    if (sort) {
        aux = { sort, ...aux };
    }
    if (after) {
        aux = { after, ...aux };
    }
    if (before) {
        aux = { before, ...aux };
    }
    if (query) {
        aux = { query, ...aux };
    }
    if (filter.extras) {
        aux = { 'act.name': '!onblock', ...aux, ...filter.extras };
    }
    aux = { page, ...aux };
    const params: AxiosRequestConfig = aux as AxiosRequestConfig;

    return await zjAxios.get<ZjResponse<Transaction>>('transactions_list/', {
        params,
    });
};

export const getTransaction = async function (
    address?: string,
): Promise<Transaction> {
    const response = await zjAxios.get<ZjResponse<Transaction>>(
        'get_transaction',
        {
            params: { id: address },
        },
    );
    return response.data.data;
};

export const getBlocks = async function (
    filter: CommonFilter,
): Promise<AxiosResponse<ZjResponse<Block>>> {
    controller.abort();
    const account = filter.account || '';
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = Math.max(0, page - 1) * limit;
    const notified = filter.notified || '';
    const sort = filter.sort || 'desc';
    const after = filter.after || '';
    const before = filter.before || '';
    const query = filter.query || '';

    let aux = {};

    if (query) {
        aux = { query, ...aux };
    }
    if (account) {
        aux = { account, ...aux };
    }
    if (limit) {
        aux = { limit, ...aux };
    }
    if (skip) {
        aux = { skip, ...aux };
    }
    if (notified) {
        aux = { notified, ...aux };
    }
    if (sort) {
        aux = { sort, ...aux };
    }
    if (after) {
        aux = { after, ...aux };
    }
    if (before) {
        aux = { before, ...aux };
    }
    if (filter.extras) {
        aux = { 'act.name': '!onblock', ...aux, ...filter.extras };
    }
    aux = { page, ...aux };
    const params: AxiosRequestConfig = aux as AxiosRequestConfig;

    return await zjAxios.get<ZjResponse<Block>>('block_list/', {
        params,
    });
};

export const getBlock = async function (
    block?: string,
): Promise<Block> {
    controller.abort();
    const response = await zjAxios.get<ZjResponse<Block>>(
        'get_block',
        {
            params: { block_hash: block },
        },
    );
    return response.data.data;
};

export const getInfo = async function (): Promise<ChainInfoResponse> {
    controller.abort();
    const response = await zjAxios.post('get_statistics/');
    return response.data as ChainInfoResponse;
};

export const getAccounts = async function (
    filter: CommonFilter,
): Promise<AxiosResponse<ZjResponse<Account>>> {
    const account = filter.account || '';
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = Math.max(0, page - 1) * limit;
    const notified = filter.notified || '';
    const sort = filter.sort || 'desc';
    const after = filter.after || '';
    const before = filter.before || '';
    const query = filter.query || '';
    let aux = {};
    if (query) {
        aux = { query, ...aux };
    }
    if (account) {
        aux = { account, ...aux };
    }
    if (limit) {
        aux = { limit, ...aux };
    }
    if (skip) {
        aux = { skip, ...aux };
    }
    if (notified) {
        aux = { notified, ...aux };
    }
    if (sort) {
        aux = { sort, ...aux };
    }
    if (after) {
        aux = { after, ...aux };
    }
    if (before) {
        aux = { before, ...aux };
    }
    if (filter.extras) {
        aux = { 'act.name': '!onblock', ...aux, ...filter.extras };
    }
    aux = { page, ...aux };
    const params: AxiosRequestConfig = aux as AxiosRequestConfig;

    return await zjAxios.get<ZjResponse<Account>>('account_list/', {
        params,
    });
};


export const getAccount = async function (
    account?: string,
): Promise<Account> {
    controller.abort();
    const response = await zjAxios.get<ZjResponse<Account>>(
        'get_account',
        {
            params: { account: account },
        },
    );
    return response.data.data ;
};

export const getAccountKeyValues = async function (
    filter: CommonFilter,
): Promise<AxiosResponse<ZjResponse<AccountKeyValue>>> {
    const params = applyDefaultFilter(filter);
    return await zjAxios.get<ZjResponse<AccountKeyValue>>('data_list/', {
        params,
    });
};

export const getContracts = async function (
    filter: CommonFilter,
): Promise<AxiosResponse<ZjResponse<AccountKeyValue>>> {
    filter.isContracts = true;
    const params = applyDefaultFilter(filter);
    return await zjAxios.get<ZjResponse<AccountKeyValue>>('data_list/', {
        params,
    });
};


export const zjApi = {
    getTransactions,
    getTransaction,
    getBlocks,
    getBlock,
    getInfo,
    getAccount,
    getAccounts,
    getAccountKeyValues,
    getContracts,
};
