import 'reflect-metadata';
import * as chai from 'chai';
import {describe, it, beforeEach} from 'mocha';
import {QueryResult} from 'pg';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import DBServiceAdapter from './adapters/DBServiceAdapter';
import PostgreDataSource from '../../src/rule_engine/tool/data_source/PostgreDataSource';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {LoggerAll} from '../../src/service/logger/LoggerAll';

const {expect} = chai;

describe('PostgreDataSource Tests', function() {
  let dbServiceAdapter: DBServiceAdapter;
  let dataSource: PostgreDataSource;
  let loggerAdapter: LoggerAdapter;

  beforeEach(async function() {
    const configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await configService.refreshConfig();

    // Setup LoggerAdapter
    loggerAdapter = new LoggerAdapter();

    // Setup DBServiceAdapter
    dbServiceAdapter = new DBServiceAdapter(loggerAdapter as unknown as LoggerAll, configService);

    // Resolve the dataSource to be tested
    dataSource = new PostgreDataSource(loggerAdapter as unknown as LoggerAll, dbServiceAdapter);
  });

  it('getPositionsByNftIds should return correct positions', async function() {
    // Setup mock response
    const mockResponse: QueryResult = {
      rows: [
        {id: 1, nftId: 100, positionState: 'LIVE'},
        {id: 2, nftId: 101, positionState: 'CLOSED'},
      ],
      // Adding required properties to match the QueryResult type
      command: '',
      rowCount: 2,
      oid: 0,
      fields: [],
    };

    dbServiceAdapter.getLeverageClient().setThrowErrorOnConnect(false);
    dbServiceAdapter.getLeverageClient().setQueryResponse(mockResponse);

    const nftIds = [100, 101];
    const positions = await dataSource.getPositionsByNftIds(nftIds);

    expect(positions).to.be.an('array').that.is.not.empty;
    expect(positions.length).to.equal(mockResponse.rows.length);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    positions.forEach((position: any, index: number) => {
      expect(position).to.include(mockResponse.rows[index]);
    });
  });

  it('dbService connect should handle database errors gracefully and log an error message', async function() {
    // Setup mock to throw error on connect
    dbServiceAdapter.getLeverageClient().setThrowErrorOnConnect(true);
    dbServiceAdapter.getLeverageClient().setErrorMessage('Database connection failed');
    dbServiceAdapter.getLeverageClient().setQueryResponse({} as QueryResult);

    let errorCaught = false;
    try {
      await dbServiceAdapter.getLeverageClient().connect();
    } catch (error) {
      if (error instanceof Error) {
        errorCaught = true;
      }
    }

    expect(errorCaught).to.be.true;
    // Verify that an error log was generated
    expect(loggerAdapter.getLatestErrorLogLine()).to.include('Error connecting to database');
  });

  it('getLivePositions should return live positions correctly', async function() {
    const mockResponse = {
      rows: [
        {id: 1, nftId: 100, positionState: 'LIVE'},
        {id: 2, nftId: 101, positionState: 'LIVE'},
      ],
      command: '',
      rowCount: 2,
      oid: 0,
      fields: [],
    };
    dbServiceAdapter.getLeverageClient().setQueryResponse(mockResponse);

    const positions = await dataSource.getLivePositions();

    expect(positions).to.be.an('array').that.is.not.empty;
    expect(positions.length).to.equal(mockResponse.rows.length);
    positions.forEach((position, index) => {
      expect(position).to.deep.include(mockResponse.rows[index]);
    });
  });

  it('getLivePositions should handle errors gracefully', async function() {
    dbServiceAdapter.getLeverageClient().setThrowErrorOnConnect(true);
    dbServiceAdapter.getLeverageClient().setErrorMessage('Failed to connect to database');

    try {
      await dataSource.getLivePositions();
      expect.fail('Expected method to throw');
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).to.include('Query read timeout');
      } else {
        expect.fail('Error is not of type Error');
      }
    }
  });

  it('getLivePositionsNftIds should return NFT IDs for live positions', async function() {
    const mockResponse = {
      rows: [
        {nftId: 100},
        {nftId: 101},
      ],
      command: '',
      rowCount: 2,
      oid: 0,
      fields: [],
    };
    dbServiceAdapter.getLeverageClient().setQueryResponse(mockResponse);

    const nftIds = await dataSource.getLivePositionsNftIds();

    expect(nftIds).to.be.an('array').that.is.not.empty;
    expect(nftIds.length).to.equal(mockResponse.rows.length);
    expect(nftIds).to.deep.equal(mockResponse.rows.map((row) => row.nftId));
  });

  it('getLivePositionsNftIds should handle errors gracefully', async function() {
    dbServiceAdapter.getLeverageClient().setThrowErrorOnConnect(true);
    dbServiceAdapter.getLeverageClient().setErrorMessage('Failed to execute query');

    try {
      await dataSource.getLivePositionsNftIds();
      expect.fail('Expected method to throw');
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).to.include('Query read timeout');
      } else {
        expect.fail('Error is not of type Error');
      }
    }
  });
});
