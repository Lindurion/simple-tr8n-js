<!--
SPDX-FileCopyrightText: 2022 Eric Barndollar

SPDX-License-Identifier: Apache-2.0
-->

# simple-tr8n-js

[![Build Status](https://app.travis-ci.com/Lindurion/simple-tr8n-js.svg?branch=main)](https://app.travis-ci.com/Lindurion/simple-tr8n-js)

Really simple JavaScript (TypeScript) library for translating user-facing
messages. Designed for JavaScript libraries that don't want to require their
client applications to use any specific heavyweight i18n framework.

Places all translation operations behind the `Translator` interface (declared
[here](src/translator.ts)). Clients of your library then have two options:
1. Use the provided `SimpleTranslator` implementation.
2. Provide their own implementation of `Translator`, which can then delegate to
   whichever i18n framework they choose.

The simple implementation supports argument substitution with `%{argName}`
syntax as well as plurals (varying messages based on one numerical input
argument).

It does NOT currently support gender or other more advanced i18n framework
features.

## How to Use in Your Library

Add dependency using `npm` or `yarn`.

```bash
$ npm install simple-tr8n
```

Define an enum for all messages to be translated, giving each one a unique
string value. Document any interpolated arguments and their types in the
comments. For example:

```typescript
export const enum MyLibMsgType {
  /** Args: userFirstName (string), userAge (number). */
  EXAMPLE_MSG_A = 'mylib.a',

  /** Args: emailCount (number). */
  EXAMPLE_MSG_B = 'mylib.b',

  // ...
}
```

Define default language translations (or configure a tool to generate them),
each with a simple string template or a list of plural cases:

```typescript
const enTranslations: SimpleTranslatedMsgConfigs<MyLibMsgType> = {
  [MyLibMsgType.EXAMPLE_MSG_A]: '%{userFirstName} is %{userAge} years old',

  [MyLibMsgType.EXAMPLE_MSG_B]: [
    {count: 0, msg: 'You have no new email messages'},
    {count: 1, msg: 'You have 1 new email message'},

    // Covers emailCount >= 2 cases:
    {count: 2, msg: 'You have %{emailCount} new email messages'},
  ],

  // ...
};
```

For each translated language you support, define (or generate) a similar
`SimpleTranslatedMsgConfigs<MyLibMsgType>` object. Note that different languages
can have fewer or more plural cases as needed.

Parameterize your library so that it can be configured with an implementation
of the `Translator` interface for your message type. For example:

```typescript
export class MyLibContext {
  constructor(readonly translator: Translator<MyLibMsgType>) {}
  // ...
}
```

Optionally configure with your primary language translations (*e.g.*
`enTranslations`) as a default value:

```typescript
const translator = new SimpleTranslator<MyLibMsgType>(enTranslations);
```

For convenience, export a type alias to represent messages within your library:

```typescript
import {TransMsg} from 'simple-tr8n';

export type MyLibMsg = TransMsg<MyLibMsgType>;
```

When your library needs to produce translated messages, use the configured
implementation:

```typescript
const msgA = translator.translate(new MyLibMsg(MyLibMsgType.EXAMPLE_MSG_A, {
  userFirstName: 'Alice',
  userAge: 34,
}));

// Last arg tells the library which key is the plural count.
const msgB = translator.translate(
    new MyLibMsg(MyLibMsgType.EXAMPLE_MSG_B, {emailCount: 3}, 'emailCount'));
```
