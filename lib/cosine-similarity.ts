// instead of keeping the weights in the dot product we
// can track the weight of each feature alongside the feature
interface WeightedFeature<T> {
    f: T;
    w: number;
}

// our feature vector which we are going to use to do the cosine similarity calculation
interface FeatureVector {
    children: WeightedFeature<Array<string>>;
    childrenLength: WeightedFeature<number>;
    siblingsLength: WeightedFeature<number>;
    parent: WeightedFeature<string>;
    node: WeightedFeature<string>;
    width: WeightedFeature<number>;
    height: WeightedFeature<number>;
    attributes: WeightedFeature<Array<string>>;
    attributesLength: WeightedFeature<number>;
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
    let pm = (a: any, b: any) => a === b ? 1 : 0;
    let wm = <T>(a: WeightedFeature<T>, b: WeightedFeature<T>) => {
        if (a.w != b.w) { throw "Can not compare features with different weights!"; }
        return a.f === b.f ? a.w : 0;
    };
    let wp = <T>(a: WeightedFeature<T>, b: WeightedFeature<T>) => a.w * wm(a, b);
    let wpp = (w: number, a: any, b: any) => w * pm(a, b);
    let sum = wp(a.node, b.node) + wp(a.parent, b.parent) +
        wp(a.childrenLength, b.childrenLength) +
        wp(a.siblingsLength, b.siblingsLength) +
        wp(a.attributesLength, b.attributesLength) +
        wp(a.width, b.width) +
        wp(a.height, b.height);
    let childIterationLength = Math.min(a.childrenLength.f, b.childrenLength.f);
    for (let index = 0; index < childIterationLength; index++) {
        sum += wpp(a.children.w, a.children.f[index], b.children.f[index]);
    }
    let attributeIterationLength = Math.min(a.attributesLength.f, b.attributesLength.f);
    for (let index = 0; index < attributeIterationLength; index++) {
        sum += wpp(a.attributes.w, a.attributes.f[index], b.attributes.f[index]);
    }
    return sum;
}

// map a DOM element to its features
function extractFeatures(node : HTMLElement): FeatureVector {
    let wf = <T>(f: T, w: number): WeightedFeature<T> => { return {f: f, w: w} };
    // we are going to use the name to find all the nodes with same name
    let name: string = node.nodeName;
    // first we iterate over the child nodes and add their names to a list
    let children: Array<string> = [];
    for (let child of node.childNodes as any as Array<HTMLElement>) {
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
    let matches = Array.prototype.slice.call(
        document.querySelectorAll(anchorFeatures.node.f)) as Array<HTMLElement>;
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
