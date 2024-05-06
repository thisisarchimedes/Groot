import {Rule} from './Rule';
import {RuleConstructorInput} from '../TypesRule';

export class RuleBalanceCurvePoolWithVault extends Rule {
  public evaluate(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  protected generateUniqueKey(): string {
    throw new Error('Method not implemented.');
  }

  constructor(input: RuleConstructorInput) {
    super(input);
  }
}
