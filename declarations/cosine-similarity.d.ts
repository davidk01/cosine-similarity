// instead of keeping the weights in the dot product we
// can track the weight of each feature alongside the feature
interface WeightedFeature<T> {
    readonly f: T;
    readonly w: number;
}

// our feature vector which we are going to use to do the cosine similarity calculation
interface FeatureVector {
    readonly children: WeightedFeature<Array<string>>;
    readonly childrenLength: WeightedFeature<number>;
    readonly siblingsLength: WeightedFeature<number>;
    readonly parent: WeightedFeature<string>;
    readonly node: WeightedFeature<string>;
    readonly width: WeightedFeature<number>;
    readonly height: WeightedFeature<number>;
    readonly attributes: WeightedFeature<Array<string>>;
    readonly attributesLength: WeightedFeature<number>;
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