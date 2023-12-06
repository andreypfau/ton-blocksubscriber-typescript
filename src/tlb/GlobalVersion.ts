import {Slice} from "@ton/core";

export class GlobalVersion {
    version: number;
    capabilities: number;

    constructor(slice: Slice) {
        slice.skip(8);

        this.version = slice.loadUint(32);
        this.capabilities = slice.loadUint(64);
    }
}