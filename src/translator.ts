// SPDX-FileCopyrightText: 2022 Eric Barndollar
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Represents a simple translatable message and its associated named arguments
 * necessary to produce a user-visible string.
 */
export class TransMsg<MsgType extends string> {
  /**
   * @param msgType A unique key identifying this message type.
   * @param args Named arguments that should be interpolated into the
   *     translated message; numbers will be converted to string using
   *     Number.toString().
   * @param pluralArgKey If this message varies with a plural count, the key of
   *     the number argument value within args that defines that count.
   */
  constructor(
    readonly msgType: MsgType,
    readonly args: {[key: string]: string | number},
    readonly pluralArgKey?: string | undefined,
  ) {}
}

// TODO: Consider adding support for language gender, if necessary.

/** Type that can translate TransMsg values into user-visible strings. */
export interface Translator<MsgType extends string> {
  /**
   * Translates the input message into a user-visible string.
   * @throws {Error} if this translator wasn't properly configured with a
   *     translation for the input message, or if there were problems with
   *     plurals or argument substitution.
   */
  translate(msg: TransMsg<MsgType>): string;
}
