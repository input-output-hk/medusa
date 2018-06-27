require('es6-promise').polyfill()
require('isomorphic-fetch')
var cors = require('cors')

const accessToken = '#####'

var getFileInfoFn = function (req, res) {
  var GHRepo
  var GHOwner
  var GHBranch
  var path
  var commitDate

  if (req.query.repo) {
    GHRepo = req.query.repo
  } else {
    res.status(400).send('repo is not defined')
  }

  if (req.query.branch) {
    GHBranch = req.query.branch
  } else {
    res.status(400).send('branch is not defined')
  }

  if (req.query.owner) {
    GHOwner = req.query.owner
  } else {
    res.status(400).send('owner is not defined')
  }

  if (req.query.path) {
    path = req.query.path
  } else {
    res.status(400).send('path is not defined')
  }

  if (req.query.date) {
    commitDate = req.query.date
  } else {
    res.status(400).send('date is not defined')
  }

  const query = `{
      repository(owner: "${GHOwner}", name: "${GHRepo}") {
        ref(qualifiedName: "${GHBranch}") {
          target {
            ... on Commit {
              history(first: 1, path: "${path}", until: "${commitDate}") {
                nodes {
                  author {
                    user {
                      login
                    }
                    name
                    email
                    date
                    avatarUrl
                  }
                  message
                  oid
                  commitUrl
                }
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
      let commitData = json.data.repository.ref.target.history.nodes[0]
      res.status(200).send(JSON.stringify(commitData))
    })
    .catch((error) => {
      console.log(error)
      res.status(400).send('Could not load commit data')
    })
}

exports.getFileInfo = (req, res) => {
  var corsFn = cors()
  corsFn(req, res, function () {
    getFileInfoFn(req, res)
  })
}
