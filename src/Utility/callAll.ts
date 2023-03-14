
export const callAll = (fs: Array<Function>, args: Array<any>, i = 0) => {
    try {
      for (; i < fs.length; i++) {
        fs[i](...args)
      }
    } finally {
      if (i < fs.length) {
        callAll(fs, args, i + 1)
      }
    }
  }