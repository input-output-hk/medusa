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
let changedFilePaths = []
let removedFilePaths = []
let nodes = {}
let latestCommit = null
let directoryNodes = {} // keep track of all directory nodes for faster lookup

const pp = function (variable) {
  console.log(JSON.stringify(variable, null, 2))
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

const addNode = function ({
  type,
  filePath,
  id = null,
  parentId = null
} = {}) {
  if (typeof nodes[filePath] !== 'undefined') {
    return {}
  }

  if (!id) {
    id = nodeCounter
  }

  nodes[filePath] = {
    type: type,
    filePath: filePath,
    id: id
  }

  if (parentId) {
    nodes[filePath].parentId = parentId
  }

  if (changedFilePaths.indexOf(filePath) !== -1) {
    nodes[filePath].updated = true
  }

  nodeCounter++

  if (type === 'dir') {
    directoryNodes[filePath] = nodes[filePath]
  }

  return nodes[filePath]
}

const updateRoutine = function () {
  getCommitTotal().then(() => {
    // lookup latest commit in db and load latest nodes/edges structure
    loadLatestCommit().then(() => {
      if (latestCommit === null) { // nothing in db
        currentCommitIndex = 0
        currentPage = commitTotal
      } else {
        currentCommitIndex = latestCommit.commitIndex + 1
        currentPage = Math.abs(currentCommitIndex - commitTotal)
      }

      // fetch next commit
      githubCliDotCom.fetchAllCommits({owner: GHOwner, repository: GHRepo, perPage: 1, page: currentPage})
        .then(commits => {
          if (commits.length > 0) {
            commits.forEach((commit) => {
              // add commit to db
              console.log('Adding commit ' + commit.sha)

              // get commit detail
              githubCliDotCom.fetchCommitBySHA({sha: commit.sha, owner: GHOwner, repository: GHRepo}).then(commitDetail => {
                // get changed files
                changedFilePaths = []
                removedFilePaths = []
                commitDetail.files.forEach((file) => {
                  if (
                    file.status === 'modified' ||
                    file.status === 'added'
                  ) {
                    changedFilePaths.push(file.filename)
                  }
                  if (file.status === 'removed') {
                    removedFilePaths.push(file.filename)
                  }
                })

                // get date as timestamp in MS
                let commitDateObj = moment(commitDetail.commit.author.date)

                githubCliDotCom.fetchTreeRecursive({sha: commit.sha, owner: GHOwner, repository: GHRepo})
                .then(treeData => {
                  // create node structure for graph
                  nodeCounter = 0
                  nodes = {}
                  directoryNodes = {}

                  // add root node
                  addNode({
                    type: 'root',
                    filePath: '/',
                    id: 0
                  })

                  for (const key in treeData.tree) {
                    if (treeData.tree.hasOwnProperty(key)) {
                      const node = treeData.tree[key]

                      let nodeType = ''
                      if (node.type === 'blob') {
                        nodeType = 'file'
                      }
                      if (node.type === 'tree') {
                        nodeType = 'dir'
                      }

                      let nodeData = {
                        type: nodeType,
                        filePath: node.path
                      }

                      // get parent dir of this node
                      let parentDirArray = []
                      let nodePathArray = node.path.split('/')
                      for (let index = 0; index < nodePathArray.length - 1; index++) {
                        parentDirArray.push(nodePathArray[index])
                      }
                      let parentDirPath = parentDirArray.join('/')

                      // check for parent directory
                      if (parentDirPath.length > 0) {
                        for (const dirKey in directoryNodes) {
                          if (directoryNodes.hasOwnProperty(dirKey)) {
                            const dirNode = directoryNodes[dirKey]
                            if (dirKey === parentDirPath) {
                              nodeData.parentId = dirNode.id
                            }
                          }
                        }
                      }

                      addNode(nodeData)
                    }
                  }

                  // create edges structure for graph
                  let edges = []
                  for (const key in nodes) {
                    if (nodes.hasOwnProperty(key)) {
                      const node = nodes[key]
                      let parentId = typeof node.parentId !== 'undefined' ? node.parentId : 0
                      if (node.id !== parentId) {
                        edges.push(node.id)
                        edges.push(parentId)
                      }
                    }
                  }

                  // save to db
                  let docRef = firebaseDB.collection(GHRepo).doc(commitDetail.sha)
                  docRef.set({
                    edges: JSON.stringify(edges),
                    nodes: JSON.stringify([nodes]),
                    authorEmail: commitDetail.commit.author.email,
                    authorName: commitDetail.commit.author.name,
                    commitDate: commitDateObj.valueOf(),
                    commitMsg: commitDetail.commit.message,
                    changedFilePaths: changedFilePaths,
                    removedFilePaths: removedFilePaths,
                    commitIndex: currentCommitIndex
                  })
                })
              })
            })
          }
        }).then(() => {
          updateRoutine()
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
    let commitData = docRef.orderBy('commitIndex', 'desc').limit(1)
    commitData.get().then(snapshot => {
      if (snapshot.empty) {
        resolve()
      }
      snapshot.forEach((doc) => {
        latestCommit = doc.data()
        latestCommit.id = doc.id
        resolve()
      })
    })
  })
}

app.listen(port, () => console.log(`Listening on port ${port}`))
