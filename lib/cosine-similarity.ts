// our feature vector which we are going to use to do the cosine similarity calculation
interface FeatureVector {
    children: Array<string>;
    siblings: Array<string>;
    childrenLength: number;
    siblingsLength: number;
    parent: string;
    node: string;
    attributes: Array<string>;
    attributesLength: number;
}

// each element is either 0 or 1 so pretty easy to calculate the norm
// we just add up everything and then take the square root
function norm(featureVector: FeatureVector) : number {
    let squaredNorm : number = dotProduct(featureVector, featureVector);
    return Math.sqrt(squaredNorm);
}

// if the objects are equal then 1 otherwise 0
// will be used when computing dot product
function matcher(a: any, b: any) : number {
    return a === b ? 1 : 0;
}

// go through children and siblings and whenever things match we add 1
function dotProduct(a: FeatureVector, b: FeatureVector) {
    let sum : number = matcher(a.node, b.node) / 10 + 
        matcher(a.parent, b.parent) / 10 +
        100 * matcher(a.childrenLength, b.childrenLength) +
        matcher(a.siblingsLength, b.siblingsLength) / 10 +
        10 * matcher(a.attributesLength, b.attributesLength);
    let childIterationLength : number = a.children.length > b.children.length ?
        b.children.length : a.children.length;
    for (let index = 0; index < childIterationLength; index++) {
        sum += 100 * matcher(a.children[index], b.children[index]);
    }
    let siblingIterationLength : number = a.siblings.length > b.siblings.length ?
        b.siblings.length : a.siblings.length;
    for (let index = 0; index < siblingIterationLength; index++) {
        sum += matcher(a.siblings[index], b.siblings[index]) / 10;
    }
    let attributeIterationLength : number = a.attributes.length > b.attributes.length ?
        b.attributes.length : a.attributes.length;
    for (let index = 0; index < attributeIterationLength; index++) {
        sum += 10 * matcher(a.attributes[index], b.attributes[index]);
    }
    return sum;
}

function extractFeatures(node : HTMLElement) : FeatureVector {
    // we are going to use the name to find all the nodes with same name
    let name : string = node.nodeName;
    // first we iterate over the child nodes and add their names to a list
    let children : Array<string> = [];
    for (let child of node.childNodes as any as Array<HTMLElement>) {
        children.push(child.nodeName);
    }
    // then we iterate over the child nodes of the parent of this node
    let siblings : Array<string> = [];
    let parent = node.parentElement;
    if (parent === null) {
        parent = new HTMLElement();
    }
    for (let sibling of parent.childNodes as any as Array<HTMLElement>) {
        siblings.push(sibling.nodeName);
    }
    let attributes : Array<string> = [];
    for (let attribute in node.attributes) {
        let name = node.attributes[attribute].name;
        let value = node.attributes[attribute].value;
        if (value === undefined) {
            continue;
        }
        attributes.push(name);
        attributes.push(value);
    }
    return {
        children: children,
        siblings: siblings,
        childrenLength: children.length,
        siblingsLength: siblings.length,
        node: name,
        parent: parent.nodeName,
        attributes: attributes,
        attributesLength: attributes.length
    };
}

// now the cosine similarity of 2 feature vectors
function cosineSimilarity(a: FeatureVector, b: FeatureVector) {
    return dotProduct(a, b) / (norm(a) * norm(b));
}

// assuming this is the first item on HN front page we are interested in
let anchorNode = document.querySelectorAll('tr.athing')[0] as HTMLElement;
let anchorFeatures : FeatureVector = extractFeatures(anchorNode);

// now go through all elements like the anchor and compute the similarity
let matches = Array.prototype.slice.call(
    document.querySelectorAll(anchorFeatures.node)) as Array<HTMLElement>;
let results = matches.map(function (element) {
    let elementFeatures = extractFeatures(element);
    let similarity = cosineSimilarity(anchorFeatures, elementFeatures);
    return [element, similarity];
});