
export const isNegative = (n: number) => {
    if (n !== 0) {
        return n < 0 
    } else {
        return 1 / n < 0
    }
}
  