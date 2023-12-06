import {Slice} from "@ton/core";
import {BlockID} from "ton-lite-client";
import {ShardIdent} from "./ShardIdent";
import {BlkMasterInfo} from "./BlkMasterInfo";
import {GlobalVersion} from "./GlobalVersion";
import {BlkPrevInfo} from "./BlkPrevInfo";

export class BlockInfo {
    version: number;
    not_master: number;
    after_merge: number;
    before_split: number;
    after_split: number;
    want_split: number;
    want_merge: number;
    key_block: number;
    vert_seqno_incr: number;
    flags: number;
    seqno: number;
    vert_seqno: number;
    shard: ShardIdent;
    gen_utime: number;
    end_lt: number;
    start_lt: number;
    gen_validator_list_hash_short: number;
    gen_catchain_seqno: number;
    min_ref_mc_seqno: number;
    prev_key_block_seqno: number;
    gen_software: GlobalVersion | null;
    master_ref: BlkMasterInfo | null;
    prev_refs: BlkPrevInfo;
    prev_ver_ref: BlkPrevInfo | null;

    constructor(slice: Slice) {
        slice.loadInt(32);

        this.version = slice.loadUint(32);
        this.not_master = slice.loadUint(1);
        this.after_merge = slice.loadUint(1);
        this.before_split = slice.loadUint(1);
        this.after_split = slice.loadUint(1);
        this.want_split = slice.loadUint(1);
        this.want_merge = slice.loadUint(1);
        this.key_block = slice.loadUint(1);
        this.vert_seqno_incr = slice.loadUint(1);
        this.flags = slice.loadUint(8);
        this.seqno = slice.loadUint(32);
        this.vert_seqno = slice.loadUint(32);
        this.shard = new ShardIdent(slice);
        this.gen_utime = slice.loadUint(32);
        this.start_lt = slice.loadUint(64);
        this.end_lt = slice.loadUint(64);
        this.gen_validator_list_hash_short = slice.loadUint(32);
        this.gen_catchain_seqno = slice.loadUint(32);
        this.min_ref_mc_seqno = slice.loadUint(32);
        this.prev_key_block_seqno = slice.loadUint(32);

        if (this.flags > 0) {
            this.gen_software = new GlobalVersion(slice);
        } else {
            this.gen_software = null;
        }
        if (this.not_master != 0) {
            this.master_ref = new BlkMasterInfo(slice.loadRef().beginParse());
        } else {
            this.master_ref = null;
        }
        this.prev_refs = new BlkPrevInfo(slice.loadRef().beginParse(), this.after_merge);
        if (this.vert_seqno_incr != 0) {
            this.prev_ver_ref = new BlkPrevInfo(slice.loadRef().beginParse(), 0);
        } else {
            this.prev_ver_ref = null;
        }
    }

    prevBlocks() {
        let prev: BlockID[] = []
        if (this.after_merge) {
            let prev1 = this.prev_refs.prevs[0]
            let prev2 = this.prev_refs.prevs[1]
            prev.push({
                workchain: this.shard.workchain_id,
                shard: ShardIdent.shardChild(this.shard.shardId(), true),
                seqno: prev1.seq_no,
                rootHash: Buffer.from(prev1.root_hash.toString(), 'hex'),
                fileHash: Buffer.from(prev1.file_hash.toString(), 'hex'),
            })
            prev.push({
                workchain: this.shard.workchain_id,
                shard: ShardIdent.shardChild(this.shard.shardId(), false),
                seqno: prev2.seq_no,
                rootHash: Buffer.from(prev2.root_hash.toString(), 'hex'),
                fileHash: Buffer.from(prev2.file_hash.toString(), 'hex'),
            })
        } else {
            let prev1 = this.prev_refs.prevs[0]
            prev.push({
                workchain: this.shard.workchain_id,
                shard: this.after_split ? ShardIdent.shardParent(this.shard.shardId()) : this.shard.shardId(),
                seqno: prev1.seq_no,
                rootHash: Buffer.from(prev1.root_hash.toString(), 'hex'),
                fileHash: Buffer.from(prev1.file_hash.toString(), 'hex'),
            })
        }
        return prev
    }
}

