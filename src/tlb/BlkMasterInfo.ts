import {Slice} from "@ton/core";
import {ExtBlkRef} from "./ExtBlkRef";

export class BlkMasterInfo {
    master: ExtBlkRef

    constructor(slice: Slice) {
        this.master = new ExtBlkRef(slice);
    }
}