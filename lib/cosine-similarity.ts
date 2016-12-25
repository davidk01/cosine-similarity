// the weights we are gonna use for each feature
const W: Weights = {
    children: 100,
    childrenLength: 50,
    siblingsLength: 1,
    node: 1 / 10,
    parent: 1 / 10,
    attributes: 100,
    attributesLength: 50,
    width: 50,
    height: 50
};

// now the cosine similarity of 2 feature vectors
function cosineSimilarity(a: FeatureVector, b: FeatureVector, w: Weights) {
    return dotProduct(a, b, w) / (norm(a, w) * norm(b, w));
}

// standard definition of norm in terms of an inner product
function norm(featureVector: FeatureVector, w: Weights) {
    const squaredNorm = dotProduct(featureVector, featureVector, w);
    return Math.sqrt(squaredNorm);
}

// just pointwise products of features multiplied by the weights
function dotProduct(a: FeatureVector, b: FeatureVector, w: Weights) {
    // some helper functions
    const pm = (a: any, b: any) => a === b ? 1 : 0; // (p)rimitive (m)atcher
    const wpp = (w: number, a: any, b: any) => w * pm(a, b); // (w)eighted (p)rimitive (p)roduct
    // first the array dot products for children
    let childrenSum = 0;
    const childIterationLength = Math.min(a.childrenLength, b.childrenLength);
    for (let index = 0; index < childIterationLength; index++) {
        childrenSum += wpp(1, a.children[index], b.children[index]);
    }
    childrenSum = w.children * childrenSum;
    // now the dot product for attributes
    const attributeIterationLength = Math.min(a.attributesLength, b.attributesLength);
    let attributeSum = 0;
    for (let index = 0; index < attributeIterationLength; index++) {
        attributeSum += wpp(1, a.attributes[index], b.attributes[index]);
    }
    attributeSum = w.attributes * attributeSum;
    // now the other components of the dot product
    const dotProductComponents: DotProductComponents = {
        attributes: attributeSum,
        children: childrenSum,
        childrenLength: wpp(w.childrenLength, a.childrenLength, b.childrenLength),
        parent: wpp(w.parent, a.parent, b.parent),
        node: wpp(w.node, a.node, b.node),
        siblingsLength: wpp(w.siblingsLength, a.siblingsLength, b.siblingsLength),
        attributesLength: wpp(w.attributesLength, a.attributesLength, b.attributesLength),
        width: wpp(w.width, a.width, b.width),
        height: wpp(w.height, a.height, b.height)
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
    // we are going to use the name to find all the nodes with same name
    const name = node.nodeName;
    // first we iterate over the child nodes and add their names to a list
    const children: Array<string> = [];
    // NodeList can not be converted to array so must bypass typechecking by casting to any
    const childNodes: Array<HTMLElement> = node.childNodes as any;
    for (let child of childNodes) {
        children.push(child.nodeName);
    }
    // casting to avoid strict null check since it is not possible when comparing
    // elements inside the html body element
    const parent = node.parentElement as HTMLElement;
    const siblingsLength = parent.childNodes.length;
    const attributes: Array<string> = [];
    for (let attribute in node.attributes) {
        const name = node.attributes[attribute].name;
        const value = node.attributes[attribute].value;
        if (value === undefined) { continue; }
        attributes.push(name);
        attributes.push(value);
    }
    return {
        children: children,
        childrenLength: children.length,
        siblingsLength: siblingsLength,
        node: name,
        parent: parent.nodeName,
        attributes: attributes,
        attributesLength: attributes.length,
        width: node.offsetWidth,
        height: node.offsetHeight
    };
}

// common set of transformations when trying to find matches for an element
function matcher(anchor: HTMLElement) {
    const anchorFeatures = extractFeatures(anchor);
    const matches: Array<HTMLElement> = Array.prototype.slice.call(
        document.querySelectorAll(anchorFeatures.node));
    const results = matches.map(element => {
        const elementFeatures = extractFeatures(element);
        const similarity = cosineSimilarity(anchorFeatures, elementFeatures, W);
        return [element, similarity] as [HTMLElement, number];
    });
    return results;
}

// demonstration for HN
function hn() {
    // assuming this is the first item on HN front page we are interested in
    const anchorNode = document.querySelectorAll('tr.athing')[0] as HTMLElement;
    const results = matcher(anchorNode);
    const filteredResults = results.filter(pair => pair[1] > 0.9)
    return filteredResults;
}

// demonstration for reddit
function reddit() {
    const anchorNode = document.querySelectorAll('div.entry')[1] as HTMLElement;
    const results = matcher(anchorNode);
    const filteredResults = results.filter(pair => pair[1] > 0.9)
    return filteredResults;
}
