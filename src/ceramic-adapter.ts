/**
 * Retrieve the latest published CID for a dataset
 * @param dataset the dataset that will be used as a key to retrieve the latest CID.
 */
export const getLatestCIDForDataset = async (dataset: string): Promise<string> => {
    throw new Error("NOT_IMPLEMENTED_YET");
}

/**
 * Store the latest published CID for a dataset
 * @param dataset the dataset that will be used as a key to store the latest CID.
 * @param cid the CID to be stored.
 */
export const storeLatestCIDForDataset = async (dataset: string, cid: string): Promise<void> => {
    throw new Error("NOT_IMPLEMENTED_YET");
}
