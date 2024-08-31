//@ts-nocheck
import {
    ActionPostResponse,
    createPostResponse,
    ActionGetResponse,
    ActionPostRequest,
    createActionHeaders,
    ACTIONS_CORS_HEADERS,
} from "@solana/actions";
import { BlinksightsClient } from 'blinksights-sdk';
import * as splToken from '@solana/spl-token';
import { clusterApiUrl, Connection, PublicKey, sendAndConfirmTransaction, Keypair, Transaction } from '@solana/web3.js';
import { Kamino, createTransactionWithExtraBudget, assignBlockInfoToTransaction } from '@kamino-finance/kliquidity-sdk';

import { NextActionLink } from "@solana/actions-spec";
import "dotenv/config";

import { send } from "process";
//const client = new BlinksightsClient(process.env.METKEY);
const client = new BlinksightsClient(process.env.METKEY);
const SEND_PUBKEY = 'SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa';

export async function GET(request: Request) {
    const url = new URL(request.url);
    console.log("URL", url);
    const payload: ActionGetResponse = {
        description: `Welcome to Kollect,a blink where you can collect your kamino rewards`,
        icon: "https://ucarecdn.com/1ec4c6f2-335d-4504-95d1-418cf983a216/kamino.png", // Local icon path
        label: `Select a pool to claim rewards from`,
        title: `Kollect`,
        links: {
            actions: [
                {
                    label: `KMNO-PYUSD`, // button text
                    href: `/api/collect?pool=1`, // api endpoint
                },
                {
                    label: `MSOL-SOL`, // button text
                    href: `/api/collect?pool=2`, // api endpoint
                },
                {
                    label: `JITOSOL-SOL-ETH`, // button text
                    href: `/api/collect?pool=3`, // api endpoint
                },
                {
                    label: `JUP-USDC`, // button text
                    href: `/api/collect?pool=4`, // api endpoint
                },
                {
                    label: `PYUSDT-USDT`, // button text
                    href: `/api/collect?pool=5`, // api endpoint
                },
                {
                    label: `JUP-SOL`, // button text
                    href: `/api/collect?pool=6`, // api endpoint
                },
            ],
        }
    };
    client.trackRenderV1(request.url, payload);
    // client.trackRenderV1(request.url, payload);
    const res = Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS,
    });
    return res;
}


export const OPTIONS = GET; // OPTIONS request handler


export async function POST(request: Request) {
    const body: ActionPostRequest = await request.json();
    const requestUrl = new URL(request.url);
    let pool = requestUrl.searchParams.get("pool")
    console.log("Pool", pool);
  client.trackActionV1(request.headers, body.account, request.url);
    //  client.trackActionV1(request.hea    ders, body.account, request.url);
    console.log("RPC",process.env.RPC);
    const connection = new Connection(process.env.RPC || clusterApiUrl('mainnet-beta'));
    const kamino = new Kamino('mainnet-beta', connection);

    let sender: PublicKey = new PublicKey(body.account);

    let strategyPubkey= new PublicKey("BMXYupw7EzkR1S7hXwLnbx8TuetdaJjmqNBpGJ1Awgdw");
    switch (requestUrl.searchParams.get("pool")) {
        case "1":
             strategyPubkey = new PublicKey('BMXYupw7EzkR1S7hXwLnbx8TuetdaJjmqNBpGJ1Awgdw');
            break;
        case "2":
             strategyPubkey = new PublicKey('2dczcMRpxWHZTcsiEjPT4YBcSseTaUmWFzw24HxYMFod');
            break;
        case "3":
             strategyPubkey = new PublicKey('HCntzqDU5wXSWjwgLQP5hqh3kLHRYizKtPErvSCyggXd');
            break;
        case "4":
             strategyPubkey = new PublicKey('4mtuHtJ4kbtXECw2WMVsh7cYmryUCU6PR699aEzT7HCj');
            break;
        case "5":
             strategyPubkey = new PublicKey('4jQtJnWSqPxnPxhD7xyPsvXwm3LKeC4wDgmZt1ks1pj3');
            break;
        case "6":
             strategyPubkey = new PublicKey('CVCsJFoYjN4gxABhuw71buKhGALRbBm5KvVJQcaodVpt');
            break;

        // you may also fetch strategies from hubble config
    }
    const strategyOwner = sender;
    
    try{
        // create a transaction that has an instruction for extra compute budget
     let tx = createTransactionWithExtraBudget(350000);
         
         // get on-chain data for a Kamino strategy
         const strategy = await kamino.getStrategyByAddress(strategyPubkey);
         if (!strategy) {
           throw Error('Could not fetch strategy from the chain');
         }
         const strategyWithAddress = { strategy, address: strategyPubkey };
         
         // create collect fee/rewards instructions
         const collectIx = await kamino.collectFeesAndRewards(strategyWithAddress,strategyOwner);
         
         tx.add(collectIx);
         
         // assign block hash, block height and fee payer to the transaction
        
         tx = await assignBlockInfoToTransaction(connection, tx, strategyOwner);
       
         const payload: ActionPostResponse = await createPostResponse({
            fields: {
                transaction: tx,
                message: `Claim Successful 🎉!!`,
            },
            // note: no additional signers are needed
            // signers: [],
        });
        const res = Response.json(payload, {
            headers: ACTIONS_CORS_HEADERS,
        });
        return res;
     
     }catch(e){
         console.log("Error here",e);
     }

    }