import {BlockID} from "ton-lite-client";
import {BlockInfo} from "./tlb/BlockInfo";

interface BlockStorage {
    insertShardBlocks(shardBlocks: BlockID[]): Promise<void>;

    getUnprocessedShardBlock(): Promise<BlockID | null>;

    setBlockProcessed(blockId: BlockID, blockInfo: BlockInfo): Promise<void>;
}

export class InMemoryBlockStorage implements BlockStorage {
    shardchainBlocks: {
        [key: string]: boolean
    }
    masterchainBlocks: {
        [key: string]: boolean
    }

    constructor() {
        this.shardchainBlocks = {};
        this.masterchainBlocks = {};
    }

    async insertMasterchainBlock(mcBlock: number) {
        // log("mc processed " + mcBlock);
        if (this.masterchainBlocks[mcBlock] !== undefined) {
            throw new Error("masterchain block already exists: " + mcBlock);
        }
        this.masterchainBlocks[mcBlock] = false;
    }

    async getLatestMasterchainBlock(): Promise<number> {
        let maxSeqno = 0;
        for (let key in this.masterchainBlocks) {
            let seqno = parseInt(key);
            if (seqno > maxSeqno) {
                maxSeqno = seqno;
            }
        }
        return maxSeqno;
    }

    async insertShardBlocks(shardBlocks: BlockID[]) {
        for (let shardBlock of shardBlocks) {
            if (shardBlock.workchain == -1) {
                continue
            }
            let key = this.blockIdKey(shardBlock);
            if (this.shardchainBlocks[key] !== undefined) {
                continue;
            }
            // log("insert shard " + key);
            // INSERT INTO shardchainBlocks VALUES (workchain, shard, seqno, rootHash, fileHash, FALSE);
            this.shardchainBlocks[key] = false;
        }
    }

    async getUnprocessedShardBlock(): Promise<BlockID | null> {
        // SELECT workchain, shard, seqno, rootHash, fileHash from sharchainBlocks WHERE processed = FALSE LIMIT 1
        for (let key in this.shardchainBlocks) {
            if (!this.shardchainBlocks[key]) {
                return this.parseBlockIdKey(key);
            }
        }
        return null;
    }

    async setBlockProcessed(blockId: BlockID) {
        // UPDATE shardchainBlocks SET processed = TRUE WHERE workchain = ? AND shard = ? AND seqno = ?
        this.shardchainBlocks[this.blockIdKey(blockId)] = true;
    }

    private blockIdKey(blockId: BlockID): string {
        return `${blockId.workchain}:${blockId.shard}:${blockId.seqno}:${blockId.rootHash.toString('hex')}:${blockId.fileHash.toString('hex')}`;
    }

    private parseBlockIdKey(key: string): BlockID {
        let [workchain, shard, seqno, rootHash, fileHash] = key.split(':');
        return {
            workchain: parseInt(workchain),
            shard: shard,
            seqno: parseInt(seqno),
            rootHash: Buffer.from(rootHash, 'hex'),
            fileHash: Buffer.from(fileHash, 'hex')
        };
    }
}