# Release Notes

## Development

[Commits](https://github.com/walmartlabs/costanza/compare/v2.1.0...master)

## v2.1.0 - January 24th, 2015
- [#21](https://github.com/walmartlabs/costanza/pull/21) - Test fix for IE8 fixes ([@zachhale](https://api.github.com/users/zachhale))
- [#20](https://github.com/walmartlabs/costanza/pull/20) - updates for ie8 ([@patrickkettner](https://api.github.com/users/patrickkettner))
- Update IE version support docs to 8 - 0fcd8da

Compatibility notes:
- IE8+ is now supported although some functionality such as catching setTimeout throws do not work in the older versions.

[Commits](https://github.com/walmartlabs/costanza/compare/v2.0.0...v2.1.0)

## v2.0.0 - December 8th, 2014
- [#19](https://github.com/walmartlabs/costanza/pull/19) - Correct support for SVGAnimatedStrings ([@zachhale](https://api.github.com/users/zachhale))
- [#18](https://github.com/walmartlabs/costanza/pull/18) - move project to gulp based build with karma and sauce ([@patrickkettner](https://api.github.com/users/patrickkettner))
- Define main module entry point - 9f5952f
- Move thorax plugin into root - 8a65ad7

Compatibility notes:
- CommonJS consumers of the constanza-thorax.js plugin now should use `require('costanza/thorax')`.

[Commits](https://github.com/walmartlabs/costanza/compare/v1.3.0...v2.0.0)

## v1.3.0 - August 18th, 2014
- [#9](https://github.com/walmartlabs/costanza/issues/9) - Investigate global eval hacks ([@kpdecker](https://api.github.com/users/kpdecker))
- Convert Costanza modules to UMD - f50d256

[Commits](https://github.com/walmartlabs/costanza/compare/v1.2.5...v1.3.0)

## v1.2.5 - July 10th, 2014
- Reuse thrown errors when marking for global filter - dde0a0f

[Commits](https://github.com/walmartlabs/costanza/compare/v1.2.4...v1.2.5)

## v1.2.4 - July 9th, 2014
- Additional stack error failover - 1ae223e
- Add failover for Costanza stack lookup - 80e113c

[Commits](https://github.com/walmartlabs/costanza/compare/v1.2.3...v1.2.4)

## v1.2.3 - July 2nd, 2014
- [#15](https://github.com/walmartlabs/costanza/pull/15) - Do not report previously handled global errors ([@kpdecker](https://api.github.com/users/kpdecker))

[Commits](https://github.com/walmartlabs/costanza/compare/v1.2.2...v1.2.3)

## v1.2.2 - April 23rd, 2014
- [#14](https://github.com/walmartlabs/costanza/pull/14) - Fix flow control on errors ([@kpdecker](https://api.github.com/users/kpdecker))
- Update README.md - 79c1afe

Compatibility notes:
- Thrown errors will be propagated up to the caller to prevent changes to execution flow.

[Commits](https://github.com/walmartlabs/costanza/compare/v1.2.1...v1.2.2)

## v1.2.1 - March 17th, 2014
- [#13](https://github.com/walmartlabs/costanza/pull/13) - Fix for Event Handlers on SVG Elements with a class. ([@DatenMetzgerX](https://api.github.com/users/DatenMetzgerX))
- Provide clearer url message for blocked scripts - 6c275c6

[Commits](https://github.com/walmartlabs/costanza/compare/v1.2.0...v1.2.1)

## v1.2.0 - January 12th, 2014
- [#7](https://github.com/walmartlabs/costanza/pull/7) - Update thorax plugin for runSection/bindSection ([@kpdecker](https://api.github.com/users/kpdecker))
- [#8](https://github.com/walmartlabs/costanza/issues/8) - Track page loading state
- Define new sections for addEventListener - 3d43080
- Augment errors with `err.info` if available. - 18cf491
- Feature detect addEventListner and setTimeout - 322b560

[Commits](https://github.com/walmartlabs/costanza/compare/v1.1.0...v1.2.0)

## v1.1.0 - December 30th, 2013
- Ignore resource load errors when unloading - e54c710
- Track page loading state in Costanza.pageUnloading - 4a40078
- Log unsupported bind types - 1bd8731
- Allow return from run calls - 360b834
- Remove use strict from library - 9309ebb

[Commits](https://github.com/walmartlabs/costanza/compare/v1.0.0...v1.1.0)


## v1.0.0 - December 13th 2013

- Initial release

[Commits](https://github.com/walmartlabs/phoenix-connection/compare/8224ab1...v1.0.0)
