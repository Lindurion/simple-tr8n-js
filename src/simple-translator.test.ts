import {
  SimpleTranslatedMsgConfigs,
  SimpleTranslator,
} from './simple-translator';
import {TransMsg, Translator} from './translator';

// Test translation configuration data:

const enum TestMsgType {
  NO_ARGS = 'test.no_args',
  HELLO_NAME = 'test.hello_name',
  PROGRESS_PCT = 'test.progress_pct',
  COUPLE_FISH_COUNT = 'test.couple_fishCount',
}

const enum TestMsgType2 {
  ADDL_MSG = 'test2.addl',
}

type UnionMsgType = TestMsgType | TestMsgType2;

const enConfig: SimpleTranslatedMsgConfigs<TestMsgType> = {
  [TestMsgType.NO_ARGS]: 'a simple message with no arguments',
  [TestMsgType.HELLO_NAME]: 'hello, %{personName}!',
  [TestMsgType.PROGRESS_PCT]: 'progress: %{pct}%',
  [TestMsgType.COUPLE_FISH_COUNT]: [
    {count: 0, msg: '%{person1Name} and %{person2Name}, you have no fish'},
    {count: 1, msg: '%{person1Name} and %{person2Name}, you have a fish'},
    {count: 2, msg: '%{person1Name} and %{person2Name}, you have two fish'},
    {
      count: 3,
      msg: '%{person1Name} and %{person2Name}, you have %{fishCount} fish',
    },
  ],
};

const esConfig: SimpleTranslatedMsgConfigs<TestMsgType> = {
  [TestMsgType.NO_ARGS]: 'un mensaje simple sin argumentos',
  [TestMsgType.HELLO_NAME]: 'hola, %{personName}!',
  [TestMsgType.PROGRESS_PCT]: 'progreso: %{pct}%',
  [TestMsgType.COUPLE_FISH_COUNT]: [
    // Omitting 0 so that error case can be tested.
    {count: 1, msg: '%{person1Name} y %{person2Name}, tienen un pez'},
    {
      count: 2,
      msg: '%{person1Name} y %{person2Name}, tienen %{fishCount} peces',
    },
    // Not providing separate cases for 2 and 3+.
  ],
};

const enConfig2: SimpleTranslatedMsgConfigs<UnionMsgType> = {
  ...enConfig,
  [TestMsgType2.ADDL_MSG]: 'An additional message with %{arg}',
};

describe('SimpleTranslator', () => {
  it('should throw Error if no configured message is found', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invalidConfig: any = {};

    const msg = new TransMsg<TestMsgType>(TestMsgType.NO_ARGS, {});

    const translator: Translator<TestMsgType> = new SimpleTranslator<
      TestMsgType
    >(invalidConfig as SimpleTranslatedMsgConfigs<TestMsgType>);
    expect(() => translator.translate(msg)).toThrowError(
      /missing translation for "test.no_args"/,
    );
  });

  it('should work for simple no-argument messages', () => {
    const msg = new TransMsg<TestMsgType>(TestMsgType.NO_ARGS, {});

    const enTranslator: Translator<TestMsgType> = new SimpleTranslator<
      TestMsgType
    >(enConfig);
    expect(enTranslator.translate(msg)).toEqual(
      'a simple message with no arguments',
    );

    const esTranslator: Translator<TestMsgType> = new SimpleTranslator<
      TestMsgType
    >(esConfig);
    expect(esTranslator.translate(msg)).toEqual(
      'un mensaje simple sin argumentos',
    );
  });

  it('should throw Error for missing argument', () => {
    // Missing %{personName} argument:
    const msg = new TransMsg<TestMsgType>(TestMsgType.HELLO_NAME, {});

    const enTranslator: Translator<TestMsgType> = new SimpleTranslator<
      TestMsgType
    >(enConfig);
    expect(() => enTranslator.translate(msg)).toThrowError(
      /"test.hello_name": missing arg "personName"/,
    );
  });

  it('should work for a 1-arg string argument message', () => {
    const msg = new TransMsg<TestMsgType>(TestMsgType.HELLO_NAME, {
      personName: 'Alice',
    });

    const enTranslator: Translator<TestMsgType> = new SimpleTranslator<
      TestMsgType
    >(enConfig);
    expect(enTranslator.translate(msg)).toEqual('hello, Alice!');

    const esTranslator: Translator<TestMsgType> = new SimpleTranslator<
      TestMsgType
    >(esConfig);
    expect(esTranslator.translate(msg)).toEqual('hola, Alice!');
  });

  it('should work for a 1-arg number argument message', () => {
    // This test also makes sure % values in the translation that don't match
    // the %{} pattern are left alone.
    const msg = new TransMsg<TestMsgType>(TestMsgType.PROGRESS_PCT, {pct: 72});

    const enTranslator: Translator<TestMsgType> = new SimpleTranslator<
      TestMsgType
    >(enConfig);
    expect(enTranslator.translate(msg)).toEqual('progress: 72%');

    const esTranslator: Translator<TestMsgType> = new SimpleTranslator<
      TestMsgType
    >(esConfig);
    expect(esTranslator.translate(msg)).toEqual('progreso: 72%');
  });

  it('should choose correct plural cases based on count', () => {
    const msg0 = new TransMsg<TestMsgType>(
      TestMsgType.COUPLE_FISH_COUNT,
      {
        person1Name: 'Alice',
        person2Name: 'Bob',
        fishCount: 0,
      },
      'fishCount',
    );
    const msg1 = new TransMsg<TestMsgType>(
      TestMsgType.COUPLE_FISH_COUNT,
      {
        person1Name: 'Alice',
        person2Name: 'Bob',
        fishCount: 1,
      },
      'fishCount',
    );
    const msg2 = new TransMsg<TestMsgType>(
      TestMsgType.COUPLE_FISH_COUNT,
      {
        person1Name: 'Alice',
        person2Name: 'Bob',
        fishCount: 2,
      },
      'fishCount',
    );
    const msg3 = new TransMsg<TestMsgType>(
      TestMsgType.COUPLE_FISH_COUNT,
      {
        person1Name: 'Alice',
        person2Name: 'Bob',
        fishCount: 3,
      },
      'fishCount',
    );
    const msg4 = new TransMsg<TestMsgType>(
      TestMsgType.COUPLE_FISH_COUNT,
      {
        person1Name: 'Alice',
        person2Name: 'Bob',
        fishCount: 4,
      },
      'fishCount',
    );
    const msg753 = new TransMsg<TestMsgType>(
      TestMsgType.COUPLE_FISH_COUNT,
      {
        person1Name: 'Alice',
        person2Name: 'Bob',
        fishCount: 753,
      },
      'fishCount',
    );

    // English was configured with separate cases for 0, 1, 2, and 3+.
    const enTranslator: Translator<TestMsgType> = new SimpleTranslator<
      TestMsgType
    >(enConfig);
    expect(enTranslator.translate(msg0)).toEqual(
      'Alice and Bob, you have no fish',
    );
    expect(enTranslator.translate(msg1)).toEqual(
      'Alice and Bob, you have a fish',
    );
    expect(enTranslator.translate(msg2)).toEqual(
      'Alice and Bob, you have two fish',
    );
    expect(enTranslator.translate(msg3)).toEqual(
      'Alice and Bob, you have 3 fish',
    );
    expect(enTranslator.translate(msg4)).toEqual(
      'Alice and Bob, you have 4 fish',
    );
    expect(enTranslator.translate(msg753)).toEqual(
      'Alice and Bob, you have 753 fish',
    );

    // Spanish was only configured with cases for 1 and 2+ (just to show that
    // different languages can be configured with a different # of cases).
    const esTranslator: Translator<TestMsgType> = new SimpleTranslator<
      TestMsgType
    >(esConfig);
    expect(esTranslator.translate(msg1)).toEqual('Alice y Bob, tienen un pez');
    expect(esTranslator.translate(msg2)).toEqual('Alice y Bob, tienen 2 peces');
    expect(esTranslator.translate(msg3)).toEqual('Alice y Bob, tienen 3 peces');
    expect(esTranslator.translate(msg4)).toEqual('Alice y Bob, tienen 4 peces');
    expect(esTranslator.translate(msg753)).toEqual(
      'Alice y Bob, tienen 753 peces',
    );
  });

  it('should throw Error if TransMsg is plural but config is not', () => {
    const pluralMsg = new TransMsg<TestMsgType>(
      TestMsgType.HELLO_NAME,
      {
        personName: 'Alice',
        person_count: 1,
      },
      'person_count',
    );

    // Configuration is non-plural for HELLO_NAME.
    const enTranslator: Translator<TestMsgType> = new SimpleTranslator<
      TestMsgType
    >(enConfig);
    expect(() => enTranslator.translate(pluralMsg)).toThrowError(
      /"test.hello_name": configured translation was plural, TransMsg non-plural/,
    );
  });

  it('should throw Error if TransMsg is not plural but config is', () => {
    const nonPluralMsg = new TransMsg<TestMsgType>(
      TestMsgType.COUPLE_FISH_COUNT,
      {
        person1Name: 'Alice',
        person2Name: 'Bob',
        fishCount: 2,
      },
    ); // Doesn't pass 'fishCount' as pluralArgKey.

    // Configuration is non-plural for HELLO_NAME.
    const enTranslator: Translator<TestMsgType> = new SimpleTranslator<
      TestMsgType
    >(enConfig);
    expect(() => enTranslator.translate(nonPluralMsg)).toThrowError(
      /"test.couple_fishCount": configured translation was non-plural, TransMsg plural/,
    );
  });

  it('should throw Error if no configured count is <= the plural argument value', () => {
    const msg0 = new TransMsg<TestMsgType>(
      TestMsgType.COUPLE_FISH_COUNT,
      {
        person1Name: 'Alice',
        person2Name: 'Bob',
        fishCount: 0,
      },
      'fishCount',
    );

    // Spanish was only configured with cases for 1 and 2+, so passing in a
    // count of 0 should not match any configuration.
    const esTranslator: Translator<TestMsgType> = new SimpleTranslator<
      TestMsgType
    >(esConfig);
    expect(() => esTranslator.translate(msg0)).toThrowError(
      /"test.couple_fishCount" had no plural configuration matching 0/,
    );
  });

  it('should throw Error if pluralArgKey value is not a number', () => {
    const msg3 = new TransMsg<TestMsgType>(
      TestMsgType.COUPLE_FISH_COUNT,
      {
        person1Name: 'Alice',
        person2Name: 'Bob',
        fishCount: '3', // This should be a number, not a string.
      },
      'fishCount',
    );

    const enTranslator: Translator<TestMsgType> = new SimpleTranslator<
      TestMsgType
    >(enConfig);
    expect(() => enTranslator.translate(msg3)).toThrowError(
      /"test.couple_fishCount": plural arg fishCount must have number value; got: 3/,
    );
  });

  it('should support union message types', () => {
    const translator: Translator<UnionMsgType> = new SimpleTranslator<
      UnionMsgType
    >(enConfig2);

    // Should work for both message types.
    const msgType1 = new TransMsg<TestMsgType>(
      TestMsgType.COUPLE_FISH_COUNT,
      {
        person1Name: 'Alice',
        person2Name: 'Bob',
        fishCount: 3,
      },
      'fishCount',
    );
    expect(translator.translate(msgType1)).toEqual(
      'Alice and Bob, you have 3 fish',
    );

    const msgType2 = new TransMsg<TestMsgType2>(TestMsgType2.ADDL_MSG, {
      arg: 'the argument',
    });
    expect(translator.translate(msgType2)).toEqual(
      'An additional message with the argument',
    );
  });
});
