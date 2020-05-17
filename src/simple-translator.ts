import {TransMsg, Translator} from './translator';

/**
 * A message with plural variations should be given as an array, in count order,
 * with each count and message value. SimpleTranslator will choose the last
 * array entry with count <= the actual count.
 *
 * For example: [
 *   {count: 1, msg: 'found one thing in %{otherArg}'},
 *   {count: 2, msg: 'found %{thingCount} things in %{otherArg}'},
 * ]
 */
export type SimpleTranslatorPluralMsgConfig = Array<{
  count: number;
  msg: string;
}>;

/**
 * Configuration value type for a translatable message.
 *
 * Named argument values will be substituted in place of '%{argKey}'
 * expressions. See SimpleTranslatorPluralMsgValue documentation for plurals.
 */
export type SimpleTranslatorMsgConfig =
  | string
  | SimpleTranslatorPluralMsgConfig;

/** Type of an object with all translated messages of MsgType. */
export type SimpleTranslatedMsgConfigs<MsgType extends string> = {
  [key in MsgType]: SimpleTranslatorMsgConfig;
};

function choosePluralCase<MsgType extends string>(
  msg: TransMsg<MsgType>,
  config: SimpleTranslatorMsgConfig,
): string {
  if (typeof config === 'string') {
    // Configured as a non-plural message.
    if (msg.pluralArgKey) {
      throw Error(
        `SimpleTranslator: "${msg.msgType}": configured translation was ` +
          'plural, TransMsg non-plural',
      );
    }
    return config;
  }

  // Configured as a plural message.
  if (!msg.pluralArgKey) {
    throw Error(
      `SimpleTranslator: "${msg.msgType}": configured translation was non-plural, TransMsg plural`,
    );
  }

  const pluralArgValue = msg.args[msg.pluralArgKey];
  if (typeof pluralArgValue === 'number') {
    // Choose config with highest count <= pluralArgValue.
    for (let i = config.length - 1; i >= 0; i--) {
      if (config[i].count <= pluralArgValue) {
        return config[i].msg;
      }
    }

    throw Error(
      `SimpleTranslator: "${msg.msgType}" had no plural configuration matching ${pluralArgValue}`,
    );
  }

  throw Error(
    `SimpleTranslator: "${msg.msgType}": plural arg ${msg.pluralArgKey} must have ` +
      `number value; got: ${pluralArgValue}`,
  );
}

const TOKEN_PATTERN = /%\{(.*?)\}/g;

function replaceArgValues<MsgType extends string>(
  msg: TransMsg<MsgType>,
  template: string,
): string {
  return template.replace(TOKEN_PATTERN, (_, argKey: string): string => {
    const value = msg.args[argKey];
    if (value === undefined) {
      throw Error(
        `SimpleTranslator: "${msg.msgType}": missing arg "${argKey}"`,
      );
    }

    return typeof value === 'string' ? value : value.toString();
  });
}

/**
 * A very simple Translator implementation that is configured at construction
 * time by passing all translations for the desired locale in a single object
 * map.
 */
export class SimpleTranslator<MsgType extends string>
  implements Translator<MsgType> {
  constructor(readonly msgConfigs: SimpleTranslatedMsgConfigs<MsgType>) {}

  translate(msg: TransMsg<MsgType>): string {
    const config: SimpleTranslatorMsgConfig = this.msgConfigs[msg.msgType];
    if (!config) {
      throw Error(`SimpleTranslator: missing translation for "${msg.msgType}"`);
    }

    const template = choosePluralCase(msg, config);
    return replaceArgValues(msg, template);
  }
}
