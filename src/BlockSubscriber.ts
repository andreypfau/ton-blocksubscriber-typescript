import EventEmitter from "events";
import {delay} from "teslabot";
import {Cell} from "@ton/core";
import {LiteClient} from "ton-lite-client";
import {liteServer_MasterchainInfoExt} from "ton-lite-client/dist/schema";
import {InMemoryBlockStorage} from "./BlockStorage";
import {log} from "./util/log";
import {BlockInfo} from "./tlb/BlockInfo";


const mcInterval = 3000;
const shardInterval = 100;

export class BlockSubscriber extends EventEmitter {

    #client: LiteClient;

    #initial: liteServer_MasterchainInfoExt;

    #stopped = false;
    #storage: InMemoryBlockStorage;
    #startLt = 0;

    constructor(initial: liteServer_MasterchainInfoExt, client: LiteClient) {
        super();
        this.#client = client;
        this.#initial = initial;
        this.#storage = new InMemoryBlockStorage();

        this.mcTick();
        this.shardsTick();
    }

    private async mcTick() {
        log('Starting from block: ' + this.#initial.last.seqno);

        const initialSeqno = this.#initial.last.seqno;
        while (!this.#stopped) {
            try {
                const lastSavedSeqno = (await this.#storage.getLatestMasterchainBlock()) || initialSeqno;
                const lastSeqno = (await this.#client.getMasterchainInfoExt()).last.seqno;
                for (let i = lastSavedSeqno; i <= lastSeqno; i++) {
                    let fullMcBlock = await this.#client.getFullBlock(i)

                    await this.#storage.insertMasterchainBlock(i);
                    await this.#storage.insertShardBlocks(fullMcBlock.shards);
                }
                await delay(mcInterval);
            } catch (e) {
                console.error("failed process mcTick: " + e)
                await delay(1000);
            }
        }
    }

    private async shardsTick() {
        while (!this.#stopped) {
            var shardBlock;
            do {
                shardBlock = await this.#storage.getUnprocessedShardBlock();
                try {
                    if (shardBlock != null) {
                        const blockHeader = await this.#client.getBlockHeader(shardBlock)
                        const blockInfo = this.unpackBlockInfo(Cell.fromBoc(blockHeader.headerProof)[0]);
                        this.emit("block", {
                            blockInfo: blockInfo,
                            blockId: shardBlock
                        });

                        await this.#storage.setBlockProcessed(shardBlock);
                        if (blockInfo.end_lt >= this.#startLt) {
                            await this.#storage.insertShardBlocks(blockInfo.prevBlocks());
                        }
                    }
                } catch (e) {
                    console.error("failed process shardsTick: " + shardBlock?.workchain + ":" + shardBlock?.shard + ":" + shardBlock?.seqno + " - " + e)
                    await delay(1000);
                }
            } while (shardBlock != null)
            await delay(shardInterval);
        }
    }

    private unpackBlockInfo(cell: Cell) {
        const slice = cell.beginParse(true);
        const block = slice.loadRef().beginParse();
        const blockInfo = block.loadRef().beginParse();
        return new BlockInfo(blockInfo);
    }
}


