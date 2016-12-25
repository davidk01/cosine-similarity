// instead of keeping the weights in the dot product we
// can track the weight of each feature alongside the feature
interface WeightedFeature<T> {
    readonly f: T; // (f)eature
    readonly w: number; // (w)eight
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
}

// now the cosine similarity of 2 feature vectors
function cosineSimilarity(a: FeatureVector, b: FeatureVector) {
    return dotProduct(a, b) / (norm(a) * norm(b));
}

// standard definition of norm in terms of an inner product
function norm(featureVector: FeatureVector) {
    let squaredNorm = dotProduct(featureVector, featureVector);
    return Math.sqrt(squaredNorm);
}

// just pointwise products of features
function dotProduct(a: FeatureVector, b: FeatureVector) {
    // some helper functions
    let pm = (a: any, b: any) => a === b ? 1 : 0; // (p)rimitive (m)atcher
    let wm = <T>(a: WeightedFeature<T>, b: WeightedFeature<T>) => { // (w)eighted (m)atcher
        if (a.w != b.w) { throw "Can not compare features with different weights!"; }
        return a.f === b.f ? a.w : 0;
    };
    let wp = <T>(a: WeightedFeature<T>, b: WeightedFeature<T>) => a.w * wm(a, b); // (w)eighted (p)roduct
    let wpp = (w: number, a: any, b: any) => w * pm(a, b); // (w)eighted (p)rimitive (p)roduct
    // first the array dot products for children
    let childrenSum = 0;
    let childIterationLength = Math.min(a.childrenLength.f, b.childrenLength.f);
    for (let index = 0; index < childIterationLength; index++) {
        childrenSum += wpp(a.children.w, a.children.f[index], b.children.f[index]);
    }
    // now the dot product for attributes
    let attributeIterationLength = Math.min(a.attributesLength.f, b.attributesLength.f);
    let attributeSum = 0;
    for (let index = 0; index < attributeIterationLength; index++) {
        attributeSum += wpp(a.attributes.w, a.attributes.f[index], b.attributes.f[index]);
    }
    // now the other components of the dot product, making it string indexable because 
    // i want to iterate over the keys
    let dotProductComponents: DotProductComponents & StringToNumber = {
        attributes: attributeSum,
        children: childrenSum,
        childrenLength: wp(a.childrenLength, b.childrenLength),
        parent: wp(a.parent, b.parent),
        node: wp(a.node, b.node),
        siblingsLength: wp(a.siblingsLength, b.siblingsLength),
        attributesLength: wp(a.attributesLength, b.attributesLength),
        width: wp(a.width, b.width),
        height: wp(a.height, b.height)
    };
    // now index over the keys and add them up
    let sum = 0;
    for (let partialSumIndex in dotProductComponents) {
        sum += dotProductComponents[partialSumIndex];
    }
    return sum;
}

// map a DOM element to its features
function extractFeatures(node : HTMLElement): FeatureVector {
    let wf = <T>(f: T, w: number): WeightedFeature<T> => { return {f: f, w: w} }; // (w)eighted (f)eature
    // we are going to use the name to find all the nodes with same name
    let name = node.nodeName;
    // first we iterate over the child nodes and add their names to a list
    let children: Array<string> = [];
    // NodeList can not be converted to array so must bypass typechecking by casting to any
    let childNodes: Array<HTMLElement> = node.childNodes as any;
    for (let child of childNodes) {
        children.push(child.nodeName);
    }
    // casting to avoid strict null check since it is not possible when comparing
    // elements inside the html body element
    let parent = node.parentElement as HTMLElement;
    let siblingsLength = parent.childNodes.length;
    let attributes: Array<string> = [];
    for (let attribute in node.attributes) {
        let name = node.attributes[attribute].name;
        let value = node.attributes[attribute].value;
        if (value === undefined) { continue; }
        attributes.push(name);
        attributes.push(value);
    }
    return {
        children: wf(children, 100),
        childrenLength: wf(children.length, 100),
        siblingsLength: wf(siblingsLength, 1),
        node: wf(name, 1 / 10),
        parent: wf(parent.nodeName, 1 / 10),
        attributes: wf(attributes, 100),
        attributesLength: wf(attributes.length, 10),
        width: wf(node.offsetWidth, 20),
        height: wf(node.offsetHeight, 20)
    };
}

// common set of transformations when trying to find matches for an element
function matcher(anchor: HTMLElement) {
    let anchorFeatures = extractFeatures(anchor);
    let matches: Array<HTMLElement> = Array.prototype.slice.call(
        document.querySelectorAll(anchorFeatures.node.f));
    let results = matches.map(element => {
        let elementFeatures = extractFeatures(element);
        let similarity = cosineSimilarity(anchorFeatures, elementFeatures);
        return [element, similarity];
    });
    return results;
}

// demonstration for HN
function hn() {
    // assuming this is the first item on HN front page we are interested in
    let anchorNode = document.querySelectorAll('tr.athing')[0] as HTMLElement;
    let results = matcher(anchorNode);
    let filteredResults = results.filter(pair => pair[1] > 0.9)
    return filteredResults;
}

// demonstration for reddit
function reddit() {
    let anchorNode = document.querySelectorAll('div.entry')[1] as HTMLElement;
    let results = matcher(anchorNode);
    let filteredResults = results.filter(pair => pair[1] > 0.9)
    return filteredResults;
}
