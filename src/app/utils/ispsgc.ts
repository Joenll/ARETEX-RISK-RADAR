export const isPSGCCode = (address: string): boolean => {
    if (typeof address !== 'string') {
      return false;
    }
    return /^\d+$/.test(address) && address.length >= 8;
  };
  