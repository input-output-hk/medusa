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
const GHRepo = config.GHRepo
const GHBranch = config.GHBranch
const GHOwner = config.GHOwner

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
let directoryNodes = {} // keep track of all directory nodes for faster lookup

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

  if (type === 'd') {
    directoryNodes[id] = nodes[id]
  }

  return nodes[id]
}

const updateRoutine = function () {
  getCommitTotal().then(() => {
    // lookup latest commit in db and load latest nodes/edges structure
    loadLatestCommit().then(() => {
      if (latestCommit === null) { // nothing in db
        currentCommitIndex = 0
        currentPage = commitTotal
      } else {
        currentCommitIndex = latestCommit.index + 1
        currentPage = Math.abs(currentCommitIndex - commitTotal)
      }

      let recurse = true

      // fetch next commit
      githubCliDotCom.fetchAllCommits({owner: GHOwner, repository: GHRepo, perPage: 1, page: currentPage, branch: GHBranch})
        .then(commits => {
          if (commits.length > 0) {
            commits.forEach((commit) => {
              if (latestCommit && latestCommit.sha === commit.sha) {
                console.log('No new commits to add')
                recurse = false
                return
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
                  }
                  if (file.status === 'modified') {
                    changedPaths.push(file.filename)
                  }
                  if (file.status === 'removed') {
                    removedPaths.push(file.filename)
                  }
                  if (file.status === 'renamed') {
                    removedPaths.push(file.previous_filename)
                  }
                })

                // get date as timestamp in MS
                let commitDateObj = moment(commitDetail.commit.author.date)

                clearNodeUpdatedFlag()

                githubCliDotCom.fetchTreeRecursive({sha: commit.sha, owner: GHOwner, repository: GHRepo})
                .then(treeData => {
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
                  for (const id in nodes) {
                    if (nodes.hasOwnProperty(id)) {
                      const node = nodes[id]
                      if (removedPaths.indexOf(node.p) !== -1) {
                        console.log('delete file', nodes[id])
                        delete nodes[id]
                      }
                    }
                  }

                  // remove empty directories
                  for (const id in nodes) {
                    if (nodes.hasOwnProperty(id)) {
                      const dirNode = nodes[id]
                      if (dirNode.t === 'd') {
                        let parentId = id

                        // check if any file nodes have this dir as a parent directory
                        let foundParentId = false
                        for (const fileId in nodes) {
                          if (nodes.hasOwnProperty(fileId)) {
                            if (nodes[fileId].pid === parentId) {
                              foundParentId = true
                              break
                            }
                          }
                        }
                        if (!foundParentId) {
                          console.log('delete dir', nodes[id])
                          delete nodes[id]
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

                  let edgesArr = []
                  edges.forEach(edge => {
                    nodesArr.forEach((node, i) => {
                      if (node.id === edge) {
                        edgesArr.push(i)
                      }
                    })
                  })

                  // save to db
                  let docRef = firebaseDB.collection(GHRepo).doc(commitDetail.sha)
                  docRef.set({
                    edges: JSON.stringify(edgesArr),
                    nodes: JSON.stringify([nodesArr]),
                    email: commitDetail.commit.author.email,
                    author: commitDetail.commit.author.name,
                    date: commitDateObj.valueOf(),
                    msg: commitDetail.commit.message,
                    changes: JSON.stringify({ a: addedPaths.length, c: changedPaths.length, r: removedPaths.length }),
                    index: currentCommitIndex,
                    count: nodeCounter
                  })
                })
              })
            })
          }
        }).then(() => {
          if (currentPage > 0 && recurse) {
            updateRoutine()
          }
        })
    })
  })
}

// script to run periodically to update the db with latest commits
app.get('/api/updateDB', (req, res) => {
  updateRoutine()
  res.send({ express: 'Commits updating...' })
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
        nodeData.forEach((node) => {
          nodes[node.id] = node
        })

        nodeCounter = latestCommit.count
        resolve()
      })
    })
  })
}

app.listen(port, () => console.log(`Listening on port ${port}`))
