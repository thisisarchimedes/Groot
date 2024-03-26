import { OutboundTransaction } from "../../blockchain/OutboundTransaction";

export interface ITransactionQueuer {
    queueTransactions(txs: OutboundTransaction[]): Promise<void>;
    refresh(): Promise<void>;
}