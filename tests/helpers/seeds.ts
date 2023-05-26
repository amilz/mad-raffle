/**
 * 
 * @param value a 64 bit integer
 * @returns a Uint8Array of the 64 bit integer in little endian format
 */
export function raffleNumberBuffer(value: bigint): Uint8Array {
    const bytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
        bytes[i] = Number(value & BigInt(0xff));
        value = value >> BigInt(8);
    }
    return bytes;
}

export const TRACKER_SEED = Buffer.from("tracker");
export const RAFFLE_SEED = Buffer.from("raffle");
export const SUPER_RAFFLE_SEED = Buffer.from("skull");