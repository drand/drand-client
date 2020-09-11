/* tslint:disable */
/* eslint-disable */
/**
* This is the entry point from JavaScript.
*
* The argument types are chosen such that the JS binding is simple
* (u32 can be expressed as number, u64 cannot; strings are easier than binary data).
*
* The result type is translated to an exception in case of an error
* and too a boolean value in case of success.
* @param {string} pk_hex
* @param {number} round
* @param {string} previous_signature_hex
* @param {string} signature_hex
* @returns {boolean}
*/
export function verify_beacon(pk_hex: string, round: number, previous_signature_hex: string, signature_hex: string): boolean;
