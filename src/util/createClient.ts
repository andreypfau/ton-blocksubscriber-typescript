import {LiteClient, LiteRoundRobinEngine, LiteSingleEngine} from 'ton-lite-client';
import {fetchConfig} from "./fetchConfig";

export async function createClient(configUrl: string) {

    // Fetch config
    console.log('fetch config from: ', configUrl);
    let config = await fetchConfig(configUrl);
    if (config.length === 0) {
        console.warn('No lite servers in config');
        return null;
    }

    // Resolve parameters
    let parallelClients = 50;
    if (process.env.TON_THREADS) {
        parallelClients = parseInt(process.env.TON_THREADS, 10);
    }

    // Create engines
    let commonClientEngines: LiteSingleEngine[] = [];
    let child: { clients: LiteClient[] }[] = []
    for (let c of config) {
        let clients: LiteClient[] = [];
        for (let i = 0; i < parallelClients; i++) {
            let engine = new LiteSingleEngine({host: `tcp://${c.ip}:${c.port}`, publicKey: c.key});
            clients.push(new LiteClient({engine, batchSize: 10}));
            commonClientEngines.push(engine);
        }
        child.push({clients});
    }

    // Create client
    let engine = new LiteRoundRobinEngine(commonClientEngines);
    let client = new LiteClient({engine, batchSize: commonClientEngines.length * 10});
    return {main: client, child};
}