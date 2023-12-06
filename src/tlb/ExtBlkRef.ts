import {BitString, Slice} from "@ton/core";

export class ExtBlkRef {
    end_lt: number;
    seq_no: number;
    root_hash: BitString;
    file_hash: BitString;

    constructor(slice: Slice) {
        this.end_lt = slice.loadUint(64);
        this.seq_no = slice.loadUint(32);
        this.root_hash = slice.loadBits(256);
        this.file_hash = slice.loadBits(256);
    }
}
