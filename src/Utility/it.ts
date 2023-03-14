export const it = <T>(value: T, block: (value: T) => void): T => {
    block(value)
    return value
}