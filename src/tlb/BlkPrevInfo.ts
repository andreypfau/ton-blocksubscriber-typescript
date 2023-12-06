import {Slice} from "@ton/core";
import {ExtBlkRef} from "./ExtBlkRef";

export class BlkPrevInfo {
    prevs: ExtBlkRef[];

    constructor(slice: Slice, after_merge: number) {
        this.prevs = [];
        if (after_merge != 0) {
            for (let i = 0; i < 2; i++) {
                this.prevs.push(new ExtBlkRef(slice.loadRef().beginParse()));
            }
        } else {
            this.prevs.push(new ExtBlkRef(slice));
        }
    }
}