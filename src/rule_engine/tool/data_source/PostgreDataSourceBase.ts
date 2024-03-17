import { LoggerAll } from '../../../service/logger/LoggerAll';
import pg from 'pg'; // Import Client instead of Pool
import { ConfigServiceAWS } from '../../../service/config/ConfigServiceAWS';

// RDS database configuration
const dbConfig = {
    user: process.env.DB_USER!,
    host: process.env.DB_HOST!,
    database: process.env.DB_NAME!,
    password: process.env.DB_PASSWORD!,
    port: Number(process.env.DB_PORT!),
    ssl: {
        rejectUnauthorized: false,
    },
};

export default class PostgreDataSourceBase {
    private client: pg.Client | null = null;
    private logger: LoggerAll;
    private configService: ConfigServiceAWS;

    constructor() {
        const environment = process.env.ENVIRONMENT as string;
        const region = process.env.AWS_REGION as string;

        this.configService = new ConfigServiceAWS(environment, region);
        this.logger = new LoggerAll(this.configService, 'Groot');
    }

    private async connect() {
        if (!this.client) {
            this.client = new pg.Client(dbConfig); // Initialize a new Client
            await this.client.connect().catch((err) => {
                this.logger.error(`Could not connect to the database: ${(err as Error).message}`);
                process.exit(-1);
            });
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected async executeQuery(query: string | { text: string, values: any[] }): Promise<QueryResult> {
        await this.connect();
        try {
            if (this.client) {
                return await this.client.query(query);
            }
        } catch (e) {
            this.logger.error((e as Error).message);
            throw e;
        }
    }
}