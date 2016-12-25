// our feature vector which we are going to use to do the cosine similarity calculation
interface FeatureVector {
    readonly children: Array<string>;
    readonly childrenLength: number;
    readonly siblingsLength: number;
    readonly parent: string;
    readonly node: string;
    readonly width: number;
    readonly height: number;
    readonly attributes: Array<string>;
    readonly attributesLength: number;
}

// required when we are iterating over the partial dot product
// components to get the final sum
interface StringToNumber {
    [index: string]: number;
}

// mapped types are pretty awesome
type DotProductComponents = {
    readonly [P in keyof FeatureVector]: number;
} & StringToNumber

// Same as above
type Weights = {
    readonly [P in keyof FeatureVector]: number;
} & StringToNumber