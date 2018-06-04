const moment = require('moment')
const express = require('express')
const fetch = require('node-fetch')

const config = require('./config')

const app = express()
const port = process.env.PORT || 5000

// firebase
const admin = require('firebase-admin')

const serviceAccount = require('./auth/' + config.FBFilename)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const firebaseDB = admin.firestore()

// github API
const GitHubClient = require('./libs/GitHubClient.js').GitHubClient
const commits = require('./libs/features/commits')
const tree = require('./libs/features/tree')
var GHRepo = config.GHRepo
var GHBranch = config.GHBranch
const GHOwner = config.GHOwner
const GHFileLimit = 300

let githubCliDotCom = new GitHubClient({
  baseUri: 'https://api.github.com',
  token: process.env.TOKEN_GITHUB_DOT_COM
}, commits, tree)

let currentPage = 0 // which page of results are we on
let currentCommitIndex = 0 // keep track of the index of each commit in the history
let nodeCounter = 0
let commitTotal = 0 // total number of commits in this repo
let addedPaths = []
let changedPaths = []
let removedPaths = []
let nodes = {}
let latestCommit = null
let previousNodeData = {}

const pp = function (variable) {
  console.log(JSON.stringify(variable, null, 2))
}

const clearNodeUpdatedFlag = function () {
  for (const id in nodes) {
    if (nodes.hasOwnProperty(id)) {
      delete nodes[id].u
    }
  }
}

/**
 * Find total number of commits on a branch
 */
const getCommitTotal = function () {
  return new Promise((resolve, reject) => {
    const accessToken = process.env.TOKEN_GITHUB_DOT_COM
    const query = `
    query {
      repository(name: "${GHRepo}", owner: "${GHOwner}"){
        ref(qualifiedName: "${GHBranch}"){
          target{
            ... on Commit{
              history{
                totalCount
              }
            }
          }
        }
      }
    }`

    fetch('https://api.github.com/graphql', {
      method: 'POST',
      body: JSON.stringify({query}),
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
      .then(res => res.text())
      .then((body) => {
        let json = JSON.parse(body)
        commitTotal = json.data.repository.ref.target.history.totalCount
        resolve()
      })
      .catch(error => console.error(error))
  })
}

/**
 * t: type (d/f/r)
 * pid: parentid
 * p: path
 * u: updated flag
 */
const addNode = function ({
  type,
  path,
  id = null,
  parentId = null
} = {}) {
  // check if this node exists
  for (const id in nodes) {
    if (nodes.hasOwnProperty(id)) {
      if (nodes[id].p === path) {
        return
      }
    }
  }

  nodeCounter++

  if (id === null) {
    id = nodeCounter
  }

  nodes[id] = {
    t: type,
    p: path
  }

  if (parentId !== null) {
    nodes[id].pid = parentId
  }

  if (changedPaths.indexOf(path) !== -1) {
    nodes[id].u = 1
  }

  if (addedPaths.indexOf(path) !== -1) {
    nodes[id].u = 1
  }

  return nodes[id]
}

const updateRoutine = function () {
  getCommitTotal().then(() => {
    // lookup latest commit in db and load latest nodes/edges structure
    loadLatestCommit().then(() => {
      if (latestCommit === null && commitTotal === 0) { // nothing in db
        currentCommitIndex = 0
        currentPage = 0
      } else {
        currentCommitIndex = latestCommit.index + 1
        currentPage = commitTotal - currentCommitIndex
      }

      let recurse = true

      // fetch next commit
      githubCliDotCom.fetchAllCommits({owner: GHOwner, repository: GHRepo, perPage: 1, page: currentPage, branch: GHBranch})
        .then(commits => {
          if (commits.length === 1) {
            commits.forEach(async (commit) => {
              let commitData = firebaseDB.collection(GHRepo).doc(commit.sha)
              let snapshot = await commitData.get()

              if (latestCommit && latestCommit.sha === commit.sha) {
                console.log('No new commits to add')
                recurse = false
                return
              }

              if (snapshot.exists) {
                console.log('Commit ' + commit.sha + ' already exists in DB, updating index')
              }

              // add commit to db
              console.log('Adding commit ' + commit.sha)

              // get commit detail
              githubCliDotCom.fetchCommitBySHA({sha: commit.sha, owner: GHOwner, repository: GHRepo}).then(commitDetail => {
                addedPaths = []
                changedPaths = []
                removedPaths = []

                commitDetail.files.forEach((file) => {
                  if (file.status === 'added') {
                    addedPaths.push(file.filename)

                    // add parent directories
                    let nodePathArray = file.filename.split('/')
                    let pathString = ''
                    for (let index = 0; index < nodePathArray.length; index++) {
                      let dirSplit = (index === 0) ? '' : '/'
                      pathString = pathString + dirSplit + nodePathArray[index]
                      if (addedPaths.indexOf(pathString) === -1) {
                        addedPaths.push(pathString)
                      }
                    }
                  }
                  if (file.status === 'modified') {
                    changedPaths.push(file.filename)
                  }
                  if (file.status === 'removed') {
                    removedPaths.push(file.filename)
                  }
                  if (file.status === 'renamed') {
                    removedPaths.push(file.previous_filename)
                    addedPaths.push(file.filename)

                    // add parent directories
                    let nodePathArray = file.filename.split('/')
                    let pathString = ''
                    for (let index = 0; index < nodePathArray.length; index++) {
                      let dirSplit = (index === 0) ? '' : '/'
                      pathString = pathString + dirSplit + nodePathArray[index]
                      if (addedPaths.indexOf(pathString) === -1) {
                        addedPaths.push(pathString)
                      }
                    }
                  }
                })

                // get date as timestamp in MS
                let commitDateObj = moment(commitDetail.commit.author.date)

                clearNodeUpdatedFlag()

                githubCliDotCom.fetchTreeRecursive({sha: commit.sha, owner: GHOwner, repository: GHRepo})
                  .then(treeData => {
                  // clear node if we are over the github file limit
                    if (commitDetail.files.length === GHFileLimit) {
                      nodes = {}
                    }

                    // add root node
                    addNode({
                      type: 'r',
                      path: '/',
                      id: 0
                    })

                    for (const key in treeData.tree) {
                      if (treeData.tree.hasOwnProperty(key)) {
                        const treeNode = treeData.tree[key]

                        let nodeType = ''
                        if (treeNode.type === 'blob') {
                          nodeType = 'f'
                        }
                        if (treeNode.type === 'tree') {
                          nodeType = 'd'
                        }

                        let nodeData = {
                          type: nodeType,
                          path: treeNode.path
                        }

                        // get parent dir of this node
                        let parentDirArray = []
                        let nodePathArray = treeNode.path.split('/')
                        for (let index = 0; index < nodePathArray.length - 1; index++) {
                          parentDirArray.push(nodePathArray[index])
                        }
                        let parentDirPath = parentDirArray.join('/')

                        // check for parent directory
                        if (parentDirPath.length > 0) {
                          for (const id in nodes) {
                            if (nodes.hasOwnProperty(id)) {
                              let node = nodes[id]
                              if (changedPaths.indexOf(node.p) !== -1) {
                                node.u = true
                              }
                              if (addedPaths.indexOf(node.p) !== -1) {
                                node.u = true
                              }
                              if (node.t === 'd') {
                                if (node.p === parentDirPath) {
                                  nodeData.parentId = id
                                }
                              }
                            }
                          }
                        }

                        addNode(nodeData)
                      }
                    }

                    // remove deleted nodes

                    // the github api only shows up to 300 files, if we are over this amount
                    // fall back to reading the directory contents (we don't use this method
                    // each time) as a branch may have been created with a completely different
                    // folder structure and the previous folder structure is carried from the
                    // previous commit - this is unusual, but if it is the case, it is most likely
                    // an experimental branch which doesn't contain many files
                    if (commitDetail.files.length === GHFileLimit) {
                    // compare previous directory structure to current

                    // check for removed nodes
                      let removedPaths = []
                      for (const key in previousNodeData) {
                        if (previousNodeData.hasOwnProperty(key)) {
                          const prevNode = previousNodeData[key]
                          let foundNode = false
                          for (const id in nodes) {
                            if (nodes.hasOwnProperty(id)) {
                              const node = nodes[id]
                              if (prevNode.p === node.p) {
                                foundNode = true
                              }
                            }
                          }
                          if (foundNode === false) {
                            removedPaths.push(prevNode.p)
                          }
                        }
                      }
                    }

                    // run through removedPaths array and delete
                    for (const id in nodes) {
                      if (nodes.hasOwnProperty(id)) {
                        const node = nodes[id]
                        let nodePathArray = node.p.split('/')
                        if (removedPaths.indexOf(node.p) !== -1) {
                          // console.log('delete node', nodes[id])
                          delete nodes[id]

                          // remove parent directories
                          let length = JSON.parse(JSON.stringify(nodePathArray.length))

                          for (let index = length; index > 0; index--) {
                            nodePathArray.pop()
                            let checkDirPath = nodePathArray.join('/')

                            // find node by path
                            for (const nodeId in nodes) {
                              if (nodes.hasOwnProperty(nodeId)) {
                                if (nodes[nodeId].p === checkDirPath) {
                                  let checkDir = nodes[nodeId]

                                  // do any nodes have this dir as a parent?
                                  let foundParent = false
                                  for (const pNodeId in nodes) {
                                    if (nodes.hasOwnProperty(pNodeId)) {
                                      if (nodes[pNodeId].pid == checkDir.id) {
                                        foundParent = true
                                      }
                                    }
                                  }

                                  if (!foundParent) {
                                    console.log('delete dir', checkDir.p)
                                    removedPaths.push(checkDir.p)
                                    delete nodes[checkDir.id]
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }

                    // create edges structure for graph
                    let edges = []
                    for (const id in nodes) {
                      if (nodes.hasOwnProperty(id)) {
                        const node = nodes[id]
                        const idInt = parseInt(id)
                        const parentId = typeof node.pid !== 'undefined' ? parseInt(node.pid) : 0

                        if (idInt !== parentId) {
                          edges.push(idInt)
                          edges.push(parentId)
                        }
                      }
                    }

                    let nodesArr = []
                    for (const key in nodes) {
                      if (nodes.hasOwnProperty(key)) {
                        nodes[key].id = parseInt(key)
                        nodesArr.push(
                          nodes[key]
                        )
                      }
                    }

                    // sort array alphabetically so the order matches on the front and back end
                    /* nodesArr.sort(function (a, b) {
                    let pathA = a.p.toUpperCase()
                    let pathB = b.p.toUpperCase()
                    return (pathA < pathB) ? -1 : (pathA > pathB) ? 1 : 0
                  }) */

                    // create array of edges
                    let edgesArr = []
                    edges.forEach(edge => {
                      nodesArr.forEach((node, i) => {
                        if (node.id === edge) {
                          edgesArr.push(i)
                        }
                      })
                    })

                    // check for added nodes
                    let addedNodes = {}
                    nodesArr.forEach((node, index) => {
                      let foundNode = false
                      for (const key in previousNodeData) {
                        if (previousNodeData.hasOwnProperty(key)) {
                          const prevNode = previousNodeData[key]
                          if (prevNode.p === node.p) {
                            foundNode = true
                          }
                        }
                      }
                      if (foundNode === false) {
                        addedNodes[index] = node
                      }
                    })

                    // check for removed nodes
                    let removedNodes = []
                    for (const key in previousNodeData) {
                      if (previousNodeData.hasOwnProperty(key)) {
                        const prevNode = previousNodeData[key]
                        let foundNode = false
                        for (const id in nodes) {
                          if (nodes.hasOwnProperty(id)) {
                            const node = nodes[id]
                            if (prevNode.p === node.p) {
                              foundNode = true
                            }
                          }
                        }
                        if (foundNode === false) {
                          removedNodes.push(prevNode.p)
                        }
                      }
                    }

                    // compare prev node order to current node order
                    // this means we can keep the same order on the front end when using the _changes db
                    let prevNodeOrder = {}
                    let i = 0
                    for (const key in previousNodeData) {
                      if (previousNodeData.hasOwnProperty(key)) {
                        const node = previousNodeData[key]
                        prevNodeOrder[i] = node
                        i++
                      }
                    }

                    let newNodeOrder = {}
                    i = 0
                    nodesArr.forEach((node, index) => {
                      newNodeOrder[i] = node
                      i++
                    })

                    let changedIds = {}

                    for (const prevKey in prevNodeOrder) {
                      if (prevNodeOrder.hasOwnProperty(prevKey)) {
                        const prevNode = prevNodeOrder[prevKey]

                        for (const newKey in newNodeOrder) {
                          if (newNodeOrder.hasOwnProperty(newKey)) {
                            const newNode = newNodeOrder[newKey]
                            if (prevNode.p === newNode.p) {
                              if (prevKey !== newKey) {
                                changedIds[newKey] = newNode
                                // console.log('changed index:', newNode)
                              }
                            }
                          }
                        }
                      }
                    }


                    let saveData = {
                      edges: JSON.stringify(edgesArr),
                      nodes: JSON.stringify([nodesArr]),
                      email: commitDetail.commit.author.email,
                      author: commitDetail.commit.author.name,
                      date: commitDateObj.valueOf(),
                      msg: commitDetail.commit.message,
                      changes: JSON.stringify({ a: addedPaths.length, c: changedPaths.length, r: removedPaths.length }),
                      index: currentCommitIndex,
                      count: nodeCounter
                    }

                    // save to db
                    let docRef = firebaseDB.collection(GHRepo).doc(commitDetail.sha)

                    if (!latestCommit) {
                      docRef.set(saveData).then(() => {
                        if (currentPage > 0 && recurse) {
                          updateRoutine()
                        }
                      })
                    } else {
                      docRef.set(saveData)
                    }

                    if (latestCommit) {
                      let docRefChanges = firebaseDB.collection(GHRepo + '_changes').doc(commitDetail.sha)

                      let changeData = {
                        edges: JSON.stringify(edgesArr),
                        changes: JSON.stringify({ a: addedNodes, c: changedPaths, r: removedNodes, i: changedIds }), // a: added; c: changed path; r: removed; i: index changed;
                        email: commitDetail.commit.author.email,
                        author: commitDetail.commit.author.name,
                        date: commitDateObj.valueOf(),
                        msg: commitDetail.commit.message,
                        index: currentCommitIndex
                      }

                      docRefChanges.set(changeData).then(() => {
                        if (currentPage > 0 && recurse) {
                          updateRoutine()
                        }
                      })
                    }
                  })
              })
            })
          }
        })
    })
  })
}

// script to run periodically to update the db with latest commits
app.get('/api/updateDB', (req, res) => {
  if (req.query.repo) {
    GHRepo = req.query.repo
  }
  if (req.query.branch) {
    GHBranch = req.query.branch
  }
  updateRoutine()
  res.send({ express: 'Updating commits for ' + GHRepo + ': ' + GHBranch + '...' })
})

app.get('/api/removeCommit', (req, res) => {
  let sha = req.query.sha

  firebaseDB.collection(GHRepo).doc(sha).delete().then(function () {
    console.log('Commit ' + sha + ' successfully deleted!')
  }).catch(function (error) {
    console.error('Error removing document: ', error)
  })

  firebaseDB.collection(GHRepo + '_changes').doc(sha).delete().then(function () {
    console.log('Commit ' + sha + ' successfully deleted (changes db)!')
  }).catch(function (error) {
    console.error('Error removing document: ', error)
  })

  res.send({ express: 'Commit ' + sha + ' removed from firestore' })
})

const loadLatestCommit = function () {
  return new Promise((resolve, reject) => {
    let docRef = firebaseDB.collection(GHRepo)
    let commitData = docRef.orderBy('index', 'desc').limit(1)
    commitData.get().then(snapshot => {
      if (snapshot.empty) {
        resolve()
      }
      snapshot.forEach((doc) => {
        latestCommit = doc.data()
        latestCommit.sha = doc.id
        let nodeData = JSON.parse(latestCommit.nodes)[0]

        nodes = {}
        previousNodeData = {}
        nodeData.forEach((node) => {
          nodes[node.id] = node
          previousNodeData[node.id] = node
        })

        nodeCounter = latestCommit.count
        resolve()
      })
    })
  })
}

app.listen(port, () => console.log(`Listening on port ${port}`))
