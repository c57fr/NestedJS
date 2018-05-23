const Node = require('./Node')
const {properties} = require('./config')
const {getContext, setContext, randomNum} = require('./utils')
const DEFAULT_OPTIONS = {}

class Nested {

    /**
     * @param {Array} data
     * @param {Object} options
     */
    constructor(data = [], options = {}) {
        this.options = Object.assign({}, DEFAULT_OPTIONS, options)
        this._uniqueid = setContext(this)
        this.data = this.buildTree(data)
        this.currentNode = null
        return getContext(this._uniqueid)
    }

    /**
     * Return entire tree size (with children)
     * @returns {number}
     */
    getTreeSize() {
        return this._count || 0
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
        let tree = data.reduce((acc, node) => {
            if (node.constructor !== Node)
                node = new Node(node, this._uniqueid)
            node.setProperty(properties.node_id, this._setUniqueId())
            node.setProperty(properties.parent_id, parentid)
            if (node.hasChildNodes())
                node.setProperty(properties.children_key, this.buildTree(node.childNodes(), node.getId()))
            acc.push(node)
            return acc
        }, [])
        for (let i = 0; i < tree.length; i++) {
            let hasPreviousNode = tree[i - 1] !== undefined && tree[i - 1].constructor === Node
            let hasNextNode = tree[i + 1] !== undefined && tree[i + 1].constructor === Node
            tree[i].setProperty(properties.prev_id, hasPreviousNode ? tree[i - 1].getId() : null)
            tree[i].setProperty(properties.next_id, hasNextNode ? tree[i + 1].getId() : null)
        }
        return tree
    }

    _setUniqueId() {
        if (!this._count) this._count = 0
        this._count += 1
        return `${properties.node_id_prefix}${this._count * randomNum()}`
    }
}

module.exports = Nested