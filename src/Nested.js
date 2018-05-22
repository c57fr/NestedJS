const Node = require('./Node')
const DEFAULT_OPTIONS = {
    properties: {
        node_id: '__nodeid',
        node_id_prefix: 'node-',
        parent_id: '__parentid',
        prev_id: '__previd',
        next_id: '__nextid',
        children_key: 'children'
    }
}

class Nested {

    /**
     * @param {Array} data
     * @param {Object} options
     */
    constructor(data = [], options = {}) {
        this.options = Object.assign({}, DEFAULT_OPTIONS, options)
        this.data = this.buildTree(data)
        this.currentNode = null
    }

    /**
     * Retrieve node by id
     * @param {String} id
     * @param {Array|null} data
     * @returns {Node|null}
     */
    retrieveNode(id, data = null) {
        if (this.currentNode !== null && this.currentNode.getId() === id)
            return this.currentNode

        if (data === null) {
            data = this.data
            this.currentNode = null
        }

        let node = null
        for (let i = 0; i < data.length; i++) {
            node = data[i]
            if (node.getId() === id) {
                this.currentNode = node
                break
            }
            else if (node.hasChildNodes()) {
                node = this.retrieveNode(id, node.childNodes())
            } else node = null
        }
        return this.currentNode
    }

    /**
     * Retrieve nodes by key-value couple
     * @param {String} key
     * @param {*|null|undefined} value
     * @param {Array} data
     * @returns {Node[]|[]}
     */
    retrieveNodesBy(key, value, data = null) {
        data = data || this.data
        let nodes = []
        for (let i = 0; i < data.length; i++) {
            let node = data[i]
            if (node.hasProperty(key) && node.getProperty(key) === value) nodes.push(node)
            if (node.hasChildNodes())
                nodes = nodes.concat(this.retrieveNodesBy(key, value, node.childNodes()))
        }
        return nodes
    }

    /**
     * Retrieve node parent
     * @param {Node|String} node
     * @returns {Node|null}
     */
    getParentNode(node) {
        const id = node.constructor === Node ? node.getParentId() : node
        return this.retrieveNode(id)
    }

    /**
     * Retrieve node siblings
     * @param {Node|String} node
     * @returns {Array}
     */
    getSiblingsNodes(node) {
        return [].concat(this.getPreviousNodes(node), this.getNextNodes(node))
    }

    /**
     * Retrieve previous nodes by id
     * @param {Node|String} node
     * @returns {Array}
     */
    getPreviousNodes(node) {
        if (node.constructor === String) node = this.retrieveNode(node)
        let previousNodes = []
        if (node !== null && node.getPreviousId() !== null) {
            previousNodes.push(node.previousNode())
            previousNodes = previousNodes.concat(this.getPreviousNodes(node.getPreviousId()))
        }
        return previousNodes
    }

    /**
     * Retrieve previous node
     * @param {Node|String} node
     * @returns {Node}
     */
    getPreviousNode(node) {
        const id = node.constructor === Node ? node.getPreviousId() : node
        return id !== null ? this.retrieveNode(id) : null
    }

    /**
     * Retrieve node next nodes
     * @param {Node|String} node
     * @returns {Array}
     */
    getNextNodes(node) {
        if (node.constructor === String) node = this.retrieveNode(node)
        let nextNodes = []
        if (node !== null && node.getNextId() !== null) {
            nextNodes.push(node.nextNode())
            nextNodes = nextNodes.concat(this.getNextNodes(node.getNextId()))
        }
        return nextNodes
    }

    /**
     * Retrieve next node
     * @param {Node|String} node
     * @returns {Node}
     */
    getNextNode(node) {
        const id = node.constructor === Node ? node.getNextId() : node
        return id !== null ? this.retrieveNode(id) : null
    }

    /**
     * Retrieve node breadcrumb
     * @param {Node|String} node
     * @returns {Array}
     */
    getBreadcrumb(node) {
        if (node.constructor === String) node = this.retrieveNode(node)
        let breadcrumb = []
        breadcrumb.push(node)
        if (node.getParentId() !== null)
            breadcrumb = breadcrumb.concat(this.getBreadcrumb(node.getParentId()))
        return breadcrumb
    }

    /**
     * @param {Array} data
     * @param {String|null} parentid
     * @returns {Node[]}
     */
    buildTree(data = [], parentid = null) {
        if (!this.count) this.count = 0
        let tree = data.reduce((acc, node) => {
            this.count += 1
            if (node.constructor !== Node)
                node = new Node(node, this)
            node.setProperty(this.options.properties.node_id, `${this.options.properties.node_id_prefix}${this.count * Math.floor((Math.random() * 10000) + 1)}`)
            node.setProperty(this.options.properties.parent_id, parentid)
            if (node.hasChildNodes())
                node.setProperty(this.options.properties.children_key, this.buildTree(node.childNodes(), node.getId()))
            acc.push(node)
            return acc
        }, [])
        for (let i = 0; i < tree.length; i++) {
            let hasPreviousNode = tree[i - 1] !== undefined && tree[i - 1].constructor === Node
            let hasNextNode = tree[i + 1] !== undefined && tree[i + 1].constructor === Node
            tree[i].setProperty(this.options.properties.prev_id, hasPreviousNode ? tree[i - 1].getId() : null)
            tree[i].setProperty(this.options.properties.next_id, hasNextNode ? tree[i + 1].getId() : null)
        }
        return tree
    }

}

module.exports = Nested