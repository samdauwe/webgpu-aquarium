import { DeepImmutable, FloatArray, float, int, size_t } from "./types";

/**
 * @fileoverview This class contains functions to perform matrix calculations including
 * multiply, addition, substraction, transpose, inverse, translation, etc.
 */
export class Matrix {

    /**
     * A constant for the pseudoRandom function.
     * @private
     * @type {number}
     */
    private static _RANDOM_RANGE: size_t = 4294967296;

    /**
     * A random seed for the pseudoRandom function.
     * @private
     * @type {number}
     */
    private static _randomSeed: size_t = 0;

    /**
     * Multiplies two 4-by-4 matrices; assumes that the given matrices are 4-by-4;
     * assumes matrix entries are accessed in [row][column] fashion.
     * @param {!FloatArray} dst The matrix product of a and b destination.
     * @param {!FloatArray} a The matrix on the left.
     * @param {!FloatArray} b The matrix on the right.
     */
    public static mulMatrixMatrix4(dst: FloatArray, a: DeepImmutable<FloatArray>, b: DeepImmutable<FloatArray>): void {
        const a00 = a[0];
        const a01 = a[1];
        const a02 = a[2];
        const a03 = a[3];
        const a10 = a[4 + 0];
        const a11 = a[4 + 1];
        const a12 = a[4 + 2];
        const a13 = a[4 + 3];
        const a20 = a[8 + 0];
        const a21 = a[8 + 1];
        const a22 = a[8 + 2];
        const a23 = a[8 + 3];
        const a30 = a[12 + 0];
        const a31 = a[12 + 1];
        const a32 = a[12 + 2];
        const a33 = a[12 + 3];
        const b00 = b[0];
        const b01 = b[1];
        const b02 = b[2];
        const b03 = b[3];
        const b10 = b[4 + 0];
        const b11 = b[4 + 1];
        const b12 = b[4 + 2];
        const b13 = b[4 + 3];
        const b20 = b[8 + 0];
        const b21 = b[8 + 1];
        const b22 = b[8 + 2];
        const b23 = b[8 + 3];
        const b30 = b[12 + 0];
        const b31 = b[12 + 1];
        const b32 = b[12 + 2];
        const b33 = b[12 + 3];
        dst[0]    = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
        dst[1]    = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
        dst[2]    = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
        dst[3]    = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
        dst[4]    = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
        dst[5]    = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
        dst[6]    = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
        dst[7]    = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
        dst[8]    = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
        dst[9]    = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
        dst[10]   = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
        dst[11]   = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
        dst[12]   = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
        dst[13]   = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
        dst[14]   = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
        dst[15]   = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;
    }

    /**
     * Computes the inverse of a 4-by-4 matrix.
     * @param {!FloatArray} dst The inverse of m destination.
     * @param {!FloatArray} m The matrix.
     */
    public static inverse4(dst: FloatArray, m: DeepImmutable<FloatArray>): void {
        const m00    = m[0 * 4 + 0];
        const m01    = m[0 * 4 + 1];
        const m02    = m[0 * 4 + 2];
        const m03    = m[0 * 4 + 3];
        const m10    = m[1 * 4 + 0];
        const m11    = m[1 * 4 + 1];
        const m12    = m[1 * 4 + 2];
        const m13    = m[1 * 4 + 3];
        const m20    = m[2 * 4 + 0];
        const m21    = m[2 * 4 + 1];
        const m22    = m[2 * 4 + 2];
        const m23    = m[2 * 4 + 3];
        const m30    = m[3 * 4 + 0];
        const m31    = m[3 * 4 + 1];
        const m32    = m[3 * 4 + 2];
        const m33    = m[3 * 4 + 3];
        const tmp_0  = m22 * m33;
        const tmp_1  = m32 * m23;
        const tmp_2  = m12 * m33;
        const tmp_3  = m32 * m13;
        const tmp_4  = m12 * m23;
        const tmp_5  = m22 * m13;
        const tmp_6  = m02 * m33;
        const tmp_7  = m32 * m03;
        const tmp_8  = m02 * m23;
        const tmp_9  = m22 * m03;
        const tmp_10 = m02 * m13;
        const tmp_11 = m12 * m03;
        const tmp_12 = m20 * m31;
        const tmp_13 = m30 * m21;
        const tmp_14 = m10 * m31;
        const tmp_15 = m30 * m11;
        const tmp_16 = m10 * m21;
        const tmp_17 = m20 * m11;
        const tmp_18 = m00 * m31;
        const tmp_19 = m30 * m01;
        const tmp_20 = m00 * m21;
        const tmp_21 = m20 * m01;
        const tmp_22 = m00 * m11;
        const tmp_23 = m10 * m01;

        const t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) - (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
        const t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) - (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
        const t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) - (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
        const t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) - (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

        const d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

        dst[0] = d * t0;
        dst[1] = d * t1;
        dst[2] = d * t2;
        dst[3] = d * t3;
        dst[4] =
            d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) - (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
        dst[5] =
            d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) - (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
        dst[6]  = d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
                    (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
        dst[7]  = d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
                    (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
        dst[8]  = d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
                    (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
        dst[9]  = d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
                    (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
        dst[10] = d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
                    (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
        dst[11] = d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
                    (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
        dst[12] = d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
                    (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
        dst[13] = d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
                    (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
        dst[14] = d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
                    (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
        dst[15] = d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
                    (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));
    }

    /**
     * Takes the transpose of a matrix.
     * @param {!Matrix} dst The transpose of m result.
     * @param {!Matrix} m The matrix.
     */
    public static transpose4(dst: Matrix, m: DeepImmutable<Matrix>): void {
        const m00 = m[0 * 4 + 0];
        const m01 = m[0 * 4 + 1];
        const m02 = m[0 * 4 + 2];
        const m03 = m[0 * 4 + 3];
        const m10 = m[1 * 4 + 0];
        const m11 = m[1 * 4 + 1];
        const m12 = m[1 * 4 + 2];
        const m13 = m[1 * 4 + 3];
        const m20 = m[2 * 4 + 0];
        const m21 = m[2 * 4 + 1];
        const m22 = m[2 * 4 + 2];
        const m23 = m[2 * 4 + 3];
        const m30 = m[3 * 4 + 0];
        const m31 = m[3 * 4 + 1];
        const m32 = m[3 * 4 + 2];
        const m33 = m[3 * 4 + 3];

        dst[0]  = m00;
        dst[1]  = m10;
        dst[2]  = m20;
        dst[3]  = m30;
        dst[4]  = m01;
        dst[5]  = m11;
        dst[6]  = m21;
        dst[7]  = m31;
        dst[8]  = m02;
        dst[9]  = m12;
        dst[10] = m22;
        dst[11] = m32;
        dst[12] = m03;
        dst[13] = m13;
        dst[14] = m23;
        dst[15] = m33;
    }

    /**
     * Computes a 4-by-4 perspective transformation matrix given the left, right,
     * top, bottom, near and far clipping planes. The arguments define a frustum
     * extending in the negative z direction. The arguments near and far are the
     * distances to the near and far clipping planes. Note that near and far are not
     * z coordinates, but rather they are distances along the negative z-axis. The
     * matrix generated sends the viewing frustum to the unit box. We assume a unit
     * box extending from -1 to 1 in the x and y dimensions and from 0 to 1 in the z
     * dimension.
     * @param {!FloatArray} dst The perspective projection matrix result.
     * @param {number} left The x coordinate of the left plane of the box.
     * @param {number} right The x coordinate of the right plane of the box.
     * @param {number} bottom The y coordinate of the bottom plane of the box.
     * @param {number} top The y coordinate of the right plane of the box.
     * @param {number} near_ The negative z coordinate of the near plane of the box.
     * @param {number} far_ The negative z coordinate of the far plane of the box.
     */
    public static frustum(dst: FloatArray, left: float, right: float, bottom: float, top: float, near_: float, far_: float): void {
        const dx: float = right - left;
        const dy: float = top - bottom;
        const dz: float = near_ - far_;

        dst[0]  = 2.0 * near_ / dx;
        dst[1]  = 0.0;
        dst[2]  = 0.0;
        dst[3]  = 0.0;
        dst[4]  = 0.0;
        dst[5]  = 2.0 * near_ / dy;
        dst[6]  = 0.0;
        dst[7]  = 0.0;
        dst[8]  = (left + right) / dx;
        dst[9]  = (top + bottom) / dy;
        dst[10] = far_ / dz;
        dst[11] = -1.0;
        dst[12] = 0.0;
        dst[13] = 0.0;
        dst[14] = near_ * far_ / dz;
        dst[15] = 0.0;
    }

    public static getAxis(dst: FloatArray, m: DeepImmutable<FloatArray>, axis: int): void {
        const off: int = axis * 4;
        dst[0]         = m[off + 0];
        dst[1]         = m[off + 1];
        dst[2]         = m[off + 2];
    }

    /**
     * Multiplies a scalar by a vector.
     * @param {number} k The scalar.
     * @param {!FloatArray} v The vector.
     * @param {!number} length The length of vector v.
     */
    public static mulScalarVector(k: number, v: FloatArray, length: size_t): void {
        for (let i = 0; i < length; ++i) {
            v[i] = v[i] * k;
        }
    }

    /**
     * Adds two vectors; assumes a and b have the same dimension.
     * @param {!FloatArray} dst The sum of a and b result.
     * @param {!FloatArray} a Operand vector.
     * @param {!FloatArray} b Operand vector.
     * @param {!number} length The length of vector a and b.
     */
    public static addVector(dst: FloatArray, a: DeepImmutable<FloatArray>, b: DeepImmutable<FloatArray>, length: size_t): void {
        for (let i = 0; i < length; ++i) {
            dst[i] = a[i] + b[i];
        }
    }

    /**
     * Divides a vector by its Euclidean length and returns the quotient.
     * @param {!Float32Array} dst The normalized vector.
     * @param {!Float32Array} a The vector.
     * @param {!number} length The length of vector a.
     */
    public static normalize(dst: Float32Array, a: DeepImmutable<Float32Array>, length: size_t): void {
        let n: float = 0.0;

        for (let i = 0; i < length; ++i) {
            n += a[i] * a[i];
        }
        n = Math.sqrt(n);
        if (n > 0.00001)
        {
            for (let i = 0; i < length; ++i) {
                dst[i] = a[i] / n;
            }
        }
        else
        {
            for (let i = 0; i < length; ++i) {
                dst[i] = 0;
            }
        }
    }

    /**
     * Subtracts two vectors.
     * @param {!FloatArray} dst The difference of a and b result.
     * @param {!FloatArray} a Operand vector.
     * @param {!FloatArray} b Operand vector.
     * @param {!number} length The length of vector a and b.
     */
    public static subVector(dst: FloatArray, a: DeepImmutable<FloatArray>, b: DeepImmutable<FloatArray>, length: size_t): void {
        for (let i = 0; i < length; ++i) {
            dst[i] = a[i] - b[i];
        }
    }

    /**
     * Computes the cross product of two vectors; assumes both vectors have
     * three entries.
     * @return {!FloatArray} The vector a cross b result.
     * @param {!FloatArray} a Operand vector.
     * @param {!FloatArray} b Operand vector.
     */
    public static cross(dst: FloatArray, a: DeepImmutable<FloatArray>, b: DeepImmutable<FloatArray>): void {
        dst[0] = a[1] * b[2] - a[2] * b[1];
        dst[1] = a[2] * b[0] - a[0] * b[2];
        dst[2] = a[0] * b[1] - a[1] * b[0];
    }

    /**
     * Computes the dot product of two vectors; assumes that a and b have
     * the same dimension.
     * @param {!Float32Array} a Operand vector.
     * @param {!Float32Array} b Operand vector.
     * @return {number} The dot product of a and b.
     */
    public static dot(a: DeepImmutable<Float32Array>, b: DeepImmutable<Float32Array>): float {
        return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
    }

    /**
     * Computes a 4-by-4 camera look-at transformation. This is the
     * inverse of lookAt The transformation generated is an
     * orthogonal rotation matrix with translation component.
     * @param {!FloatArray} dst The camera look-at matrix result.
     * @param {!FloatArray} eye The position of the eye.
     * @param {!FloatArray} target The position meant to be viewed.
     * @param {!FloatArray} up A vector pointing up.
     */
    public static cameraLookAt(dst: FloatArray, eye: DeepImmutable<FloatArray>, target: DeepImmutable<FloatArray>, up: DeepImmutable<FloatArray>): void {
        let t0: Float32Array = new Float32Array(3);
        let t1: Float32Array = new Float32Array(3);
        let t2: Float32Array = new Float32Array(3);
        Matrix.subVector(t0, eye, target, 3);
        Matrix.normalize(t0, t0, 3);
        Matrix.cross(t1, up, t0);
        Matrix.normalize(t1, t1, 3);
        Matrix.cross(t2, t0, t1);

        dst[0]  = t1[0];
        dst[1]  = t1[1];
        dst[2]  = t1[2];
        dst[3]  = 0.0;
        dst[4]  = t2[0];
        dst[5]  = t2[1];
        dst[6]  = t2[2];
        dst[7]  = 0.0;
        dst[8]  = t0[0];
        dst[9]  = t0[1];
        dst[10] = t0[2];
        dst[11] = 0.0;
        dst[12] = eye[0];
        dst[13] = eye[1];
        dst[14] = eye[2];
        dst[15] = 1.0;
    }

    /**
     * Resets the pseudoRandom function sequence.
     */
    public static resetPseudoRandom(): void {
        Matrix._randomSeed = 0;
    }

    /**
     * Returns a deterministic pseudorandom number between 0 and 1
     * @return {float} a random number between 0 and 1
     */
    public static pseudoRandom(): float {
        Matrix._randomSeed = (134775813 * Matrix._randomSeed + 1) % Matrix._RANDOM_RANGE;
        return Matrix._randomSeed / Matrix._randomSeed;
    }

    /**
     * Creates a 4-by-4 matrix which translates by the given vector v.
     * @param {!FloatArray} dst The translation matrix result.
     * @param {!Float32Array} v The vector by which to translate.
     */
    public static translation(dst: FloatArray, v: DeepImmutable<Float32Array>): void {
        dst[0]  = 1;
        dst[1]  = 0;
        dst[2]  = 0;
        dst[3]  = 0;
        dst[4]  = 0;
        dst[5]  = 1;
        dst[6]  = 0;
        dst[7]  = 0;
        dst[8]  = 0;
        dst[9]  = 0;
        dst[10] = 1;
        dst[11] = 0;
        dst[12] = v[0];
        dst[13] = v[1];
        dst[14] = v[2];
        dst[15] = 1;
    }

    /**
     * Modifies the given 4-by-4 matrix by translation by the given vector v.
     * @param {!FloatArray} m The matrix result.
     * @param {!Float32Array} v The vector by which to translate.
     */
    public static translate(m: FloatArray, v: DeepImmutable<Float32Array>): void {
        const v0  = v[0];
        const v1  = v[1];
        const v2  = v[2];
        const m00 = m[0];
        const m01 = m[1];
        const m02 = m[2];
        const m03 = m[3];
        const m10 = m[1 * 4 + 0];
        const m11 = m[1 * 4 + 1];
        const m12 = m[1 * 4 + 2];
        const m13 = m[1 * 4 + 3];
        const m20 = m[2 * 4 + 0];
        const m21 = m[2 * 4 + 1];
        const m22 = m[2 * 4 + 2];
        const m23 = m[2 * 4 + 3];
        const m30 = m[3 * 4 + 0];
        const m31 = m[3 * 4 + 1];
        const m32 = m[3 * 4 + 2];
        const m33 = m[3 * 4 + 3];

        m[12] = m00 * v0 + m10 * v1 + m20 * v2 + m30;
        m[13] = m01 * v0 + m11 * v1 + m21 * v2 + m31;
        m[14] = m02 * v0 + m12 * v1 + m22 * v2 + m32;
        m[15] = m03 * v0 + m13 * v1 + m23 * v2 + m33;
    }

    /**
     * Converts degrees to radians.
     * @param {number} degrees A value in degrees.
     * @return {number} the value in radians.
     */
    public static degToRad(degrees: float): float {
        return degrees * Math.PI / 180.0;
    }
}