import {Slice} from "@ton/core";

export class ShardIdent {
    shard_pfx_bits: number;
    workchain_id: number;
    shard_prefix: number;

    constructor(slice: Slice) {
        slice.skip(2)

        this.shard_pfx_bits = slice.loadUint(6);
        this.workchain_id = slice.loadInt(32);
        this.shard_prefix = slice.loadUint(64);
    }

    static shardChild(shard: string, left: boolean) {
        const x = this.lowerBits(BigInt(shard)) >> BigInt(1);
        let result = (left ? (BigInt(shard) - x) : (BigInt(shard) + x));
        if (result & BigInt(0x8000000000000000)) {
            result = result - BigInt(0x10000000000000000);
        }
        return result.toString();
    }

    static shardParent(shard: string) {
        const x = this.lowerBits(BigInt(shard));
        let result = ((BigInt(shard) - x) | (x << BigInt(1)));
        if (result & BigInt(0x8000000000000000)) {
            result = result - BigInt(0x10000000000000000);
        }
        return result.toString();
    }

    private static lowerBits(i: bigint) {
        return (i & (~i + BigInt(1)));
    }

    toString() {
        let pow = BigInt(1) << (BigInt(63) - BigInt(this.shard_pfx_bits));
        let shard = BigInt(this.shard_prefix) | pow;

        return `${this.workchain_id}:${shard.toString(16).padStart(16, '0')}`;
    }

    shardId() {
        let pow = BigInt(1) << (BigInt(63) - BigInt(this.shard_pfx_bits));
        let shard = BigInt(this.shard_prefix) | pow;
        if (shard & BigInt(0x8000000000000000)) {
            shard = shard - BigInt(0x10000000000000000);
        }
        return shard.toString()
    }
}
