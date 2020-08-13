/**
 * Alias type for value that can be null
 */
export type Nullable<T> = T | null;

/**
 * Alias type for number that are floats
 */
export type float = number;

/**
 * Alias type for number that are doubles.
 */
export type double = number;

/**
 * Alias type for number that are integer
 */
export type int = number;

/**
 * Alias type for number that are unsigned integer
 */
export type uint32_t = number;
export type size_t   = number;

/**
 * Alias type for number array or Float32Array
 */
export type FloatArray = number[] | Float32Array;

/**
 * Alias type for primitive types
 */
export type Primitive = undefined | null | boolean | string | number | Function;

/**
 * Type modifier to make all the properties of an object Readonly
 */
export type Immutable<T> = T extends Primitive
  ? T
  : T extends Array<infer U>
  ? ReadonlyArray<U>
  : /* T extends Map<infer K, infer V> ? ReadonlyMap<K, V> : // es2015+ only */
  DeepImmutable<T>;

/**
 * Type modifier to make all the properties of an object Readonly recursively
 */
export type DeepImmutable<T> = T extends Primitive
  ? T
  : T extends Array<infer U>
  ? DeepImmutableArray<U>
  : /* T extends Map<infer K, infer V> ? DeepImmutableMap<K, V> : // es2015+ only */
  DeepImmutableObject<T>;

export interface DeepImmutableArray<T> extends ReadonlyArray<DeepImmutable<T>> { }
export type DeepImmutableObject<T> = { readonly [K in keyof T]: DeepImmutable<T[K]> };

/**
 * Function to merge 2 TypedArrays
 */
export function MergeTypedArrays(a: any, b: any) {
  // Checks for truthy values on both arrays
  if(!a && !b) throw 'Please specify valid arguments for parameters a and b.';  

  // Checks for truthy values or empty arrays on each argument
  // to avoid the unnecessary construction of a new array and
  // the type comparison
  if(!b || b.length === 0) return a;
  if(!a || a.length === 0) return b;

  // Make sure that both typed arrays are of the same type
  if(Object.prototype.toString.call(a) !== Object.prototype.toString.call(b))
      throw 'The types of the two arguments passed for parameters a and b do not match.';

  let c = new a.constructor(a.length + b.length);
  c.set(a);
  c.set(b, a.length);

  return c;
}

/**
 * Returns an array of the given size filled with element built from the given constructor and the paramters
 * @param size the number of element to construct and put in the array
 * @param itemBuilder a callback responsible for creating new instance of item. Called once per array entry.
 * @returns a new array filled with new objects
 */
export function BuildArray<T>(size: number, itemBuilder: () => T): Array<T> {
  const a: T[] = [];
  for (let i = 0; i < size; ++i) {
      a.push(itemBuilder());
  }
  return a;
}

/**
 * Implementation of assert function.
 * @param condition the condition that should be true
 * @param message the error message
 */
export function ASSERT(condition: boolean, message: string) {
  if (!condition) {
      message = message || "Assertion failed";
      if (typeof Error !== "undefined") {
          throw new Error(message);
      }
      throw message; // Fallback
  }
}