import DBService from "../../../src/service/db/dbService";
import { PGClientAdapter } from "./PGClientAdapter";

export default class DBServiceAdapter extends DBService {
  private pgClientAdapter: PGClientAdapter = new PGClientAdapter();

  public getTransactionsClient() {
    return this.pgClientAdapter;
  }

  public getLeverageClient() {
    return this.pgClientAdapter;
  }

  async connect() {
    return;
  }

  async end() {
    return;
  }
}