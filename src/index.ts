import {log} from "./util/log";
import {createClient} from "./util/createClient";
import {BlockSubscriber} from "./BlockSubscriber";

async function main() {
    log('Downloading configuration...');
    let client = await createClient("https://raw.githubusercontent.com/andreypfau/ton-blockchain.github.io/main/global.config.json");
    if (!client) {
        return;
    }

    log('Downloading current state....');

    let mc = await client.main.getMasterchainInfoExt().catch(e => {
        console.error('getMasterchainInfoExt', e);
    });

    if (!mc) {
        console.error('getMasterchainInfoExt Failed');
        return;
    }

    let blockSubscriber = new BlockSubscriber(mc, client.main);
    blockSubscriber.addListener("block", ({blockId: BlockID, blockInfo: BlockInfo}) => {
        console.log("block: " + BlockID.workchain + ":" + BlockID.shard + ":" + BlockID.seqno)
    })
}

main()