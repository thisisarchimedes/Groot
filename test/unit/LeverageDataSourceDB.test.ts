import 'reflect-metadata';
import * as chai from 'chai';
import {describe, it, beforeEach} from 'mocha';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import DBServiceAdapter from './adapters/DBServiceAdapter';
import LeverageDataSourceDB from '../../src/rule_engine/tool/data_source/LeverageDataSourceDB';
import {ConfigServiceAWS} from '../../src/service/config/ConfigServiceAWS';
import {QueryResult} from 'pg';
import {ModulesParams} from '../../src/types/ModulesParams';

const {expect} = chai;

describe('LeverageDataSource Tests', function() {
  const modulesParams: ModulesParams = {};

  beforeEach(async function() {
    modulesParams.configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await modulesParams.configService.refreshConfig();

    // Setup LoggerAdapter
    modulesParams.logger = new LoggerAdapter();

    // Setup DBServiceAdapter
    modulesParams.dbService = new DBServiceAdapter(modulesParams.logger, modulesParams.configService);

    // Resolve the dataSource to be tested
    modulesParams.leverageDataSource = {
      leverageDataSourceDB: new LeverageDataSourceDB(modulesParams),
    };
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

    (modulesParams.dbService as DBServiceAdapter).getLeverageClient().setQueryResponse(mockResponse);

    const nftIds = [100, 101];
    const positions = await modulesParams.leverageDataSource!.leverageDataSourceDB!.getPositionsByNftIds(nftIds);

    expect(positions).to.be.an('array').that.is.not.empty;
    expect(positions.length).to.equal(mockResponse.rows.length);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    positions.forEach((position: any, index: number) => {
      expect(position).to.include(mockResponse.rows[index]);
    });
  });

  it('dbService connect should handle database errors gracefully and log an error message', async function() {
    // Setup mock to throw error on connect
    (modulesParams.dbService as DBServiceAdapter).getLeverageClient().setQueryResponse({} as QueryResult);

    let errorCaught = false;
    try {
      await (modulesParams.dbService as DBServiceAdapter).getLeverageClient().connect();
    } catch (error) {
      if (error instanceof Error) {
        errorCaught = true;
      }
    }

    expect(errorCaught).to.be.true;
    // Verify that an error log was generated
    expect((modulesParams.logger! as LoggerAdapter).getLatestErrorLogLine()).to.include('Error connecting to database');
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
    (modulesParams.dbService as DBServiceAdapter).getLeverageClient().setQueryResponse(mockResponse);

    const positions = await modulesParams.leverageDataSource!.leverageDataSourceDB!.getLivePositions();

    expect(positions).to.be.an('array').that.is.not.empty;
    expect(positions.length).to.equal(mockResponse.rows.length);
    positions.forEach((position, index) => {
      expect(position).to.deep.include(mockResponse.rows[index]);
    });
  });

  it('getLivePositions should handle errors gracefully', async function() {
    try {
      await modulesParams.leverageDataSource!.leverageDataSourceDB!.getLivePositions();
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
    (modulesParams.dbService as DBServiceAdapter).getLeverageClient().setQueryResponse(mockResponse);

    const nftIds = await modulesParams.leverageDataSource!.leverageDataSourceDB!.getLivePositionsNftIds();

    expect(nftIds).to.be.an('array').that.is.not.empty;
    expect(nftIds.length).to.equal(mockResponse.rows.length);
    expect(nftIds).to.deep.equal(mockResponse.rows.map((row) => row.nftId));
  });

  it('getLivePositionsNftIds should handle errors gracefully', async function() {
    try {
      await modulesParams.leverageDataSource!.leverageDataSourceDB!.getLivePositionsNftIds();
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
