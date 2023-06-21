

export function formatNumber(num: number) {
    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
    }).format(num);
}

export function padWithLeadingZeros(number: number) {
    if (number < 0 || number > 999) {
        return number.toString();
    }
    return number.toString().padStart(3, '0');
}




export function formatPublicKey(pubkey: string): string {
    return pubkey.slice(0, 4) + '...' + pubkey.slice(-4);
}
