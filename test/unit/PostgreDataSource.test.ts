import 'reflect-metadata';
import { Container } from 'inversify';
import * as chai from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { QueryResult } from 'pg';
import { createTestContainer } from './inversify.config.unit_test';
import { PGClientAdapter } from './adapters/PGClientAdapter';
import PostgreDataSource from '../../src/rule_engine/tool/data_source/PostgreDataSource';
import { LoggerAdapter } from './adapters/LoggerAdapter';
import { TYPES } from '../../src/inversify.types';
import { ILeverageDataSource } from '../../src/rule_engine/tool/data_source/interfaces/ILeverageDataSource';

const { expect } = chai;

describe('PostgreDataSource Tests', function () {
    let container: Container;
    let pgClientAdapter: PGClientAdapter;
    let dataSource: ILeverageDataSource;
    let loggerAdapter: LoggerAdapter;

    beforeEach(function () {
        container = createTestContainer();

        // Setup LoggerAdapter
        loggerAdapter = new LoggerAdapter();
        container.rebind(TYPES.ILoggerAll).toConstantValue(loggerAdapter);

        // Setup PGClientAdapter
        pgClientAdapter = new PGClientAdapter();
        container.rebind(TYPES.LeverageDBClient).toConstantValue(pgClientAdapter);

        // Resolve the dataSource to be tested
        dataSource = container.get<ILeverageDataSource>(TYPES.ILeverageDataSource);
    });

    it('getPositionsByNftIds should return correct positions', async function () {
        // Setup mock response
        const mockResponse: QueryResult = {
            rows: [
                { id: 1, nftId: 100, positionState: 'LIVE' },
                { id: 2, nftId: 101, positionState: 'CLOSED' }
            ],
            // Adding required properties to match the QueryResult type
            command: '',
            rowCount: 2,
            oid: 0,
            fields: [],
        };

        // Use this mockResponse in your test
        pgClientAdapter.setQueryResponse(mockResponse);

        const nftIds = [100, 101];
        const positions = await dataSource.getPositionsByNftIds(nftIds);

        expect(positions).to.be.an('array').that.is.not.empty;
        expect(positions.length).to.equal(mockResponse.rows.length);
        positions.forEach((position: any, index: number) => {
            expect(position).to.include(mockResponse.rows[index]);
        });
    });

    it('getPositionsByNftIds should handle database errors gracefully and log an error message', async function () {
        // Setup mock to throw error on connect
        pgClientAdapter.setThrowErrorOnConnect(true);
        pgClientAdapter.setErrorMessage("Database connection failed");

        const nftIds = [100, 101];
        let errorCaught = false;
        try {
            await dataSource.getPositionsByNftIds(nftIds);
        } catch (error) {
            if (error instanceof Error) {
                console.error(error.message); // TODO
            }
        }

        expect(errorCaught).to.be.true;
        // Verify that an error log was generated
        expect(loggerAdapter.getLatestErrorLogLine()).to.include("Database connection failed");
    });

    it('getLivePositions should return live positions correctly', async function () {
        const mockResponse = {
            rows: [
                { id: 1, nftId: 100, positionState: 'LIVE' },
                { id: 2, nftId: 101, positionState: 'LIVE' }
            ],
            command: '',
            rowCount: 2,
            oid: 0,
            fields: [],
        };
        pgClientAdapter.setQueryResponse(mockResponse);

        const positions = await dataSource.getLivePositions();

        expect(positions).to.be.an('array').that.is.not.empty;
        expect(positions.length).to.equal(mockResponse.rows.length);
        positions.forEach((position, index) => {
            expect(position).to.deep.include(mockResponse.rows[index]);
        });
    });

    it('getLivePositions should handle errors gracefully', async function () {
        pgClientAdapter.setThrowErrorOnConnect(true);
        pgClientAdapter.setErrorMessage("Failed to connect to database");

        try {
            await dataSource.getLivePositions();
            expect.fail('Expected method to throw');
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).to.include("Failed to connect to database");
            } else {
                expect.fail('Error is not of type Error');
            }
        }
    });

    it('getLivePositionsNftIds should return NFT IDs for live positions', async function () {
        const mockResponse = {
            rows: [
                { nftId: 100 },
                { nftId: 101 }
            ],
            command: '',
            rowCount: 2,
            oid: 0,
            fields: [],
        };
        pgClientAdapter.setQueryResponse(mockResponse);

        const nftIds = await dataSource.getLivePositionsNftIds();

        expect(nftIds).to.be.an('array').that.is.not.empty;
        expect(nftIds.length).to.equal(mockResponse.rows.length);
        expect(nftIds).to.deep.equal(mockResponse.rows.map(row => row.nftId));
    });

    it('getLivePositionsNftIds should handle errors gracefully', async function () {
        pgClientAdapter.setThrowErrorOnConnect(true);
        pgClientAdapter.setErrorMessage("Failed to execute query");

        try {
            await dataSource.getLivePositionsNftIds();
            expect.fail('Expected method to throw');
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).to.include("Failed to execute query");
            } else {
                expect.fail('Error is not of type Error');
            }
        }
    });
});
