export interface ContractRow {
    __kCreateContractBytesCode: string;
    from: string;
    to: string;
}

export interface ContractsResponse {
    status: number;
    cmd: string;
    value: ContractRow[];
}
